package main

import (
	"context"
	"fmt"
	"math"
	"os"
	"os/signal"
	"sync"
	"syscall"

	"github.com/coral/aubio-go"
	"github.com/gordonklaus/portaudio"
)

const (
	bufSize    = 1024
	sampleRate = 44100
)

// App struct
type App struct {
	ctx         context.Context
	pitchChan   chan float64
	closeChan   chan struct{}
	isDetecting bool
	latestPitch float64
	latestNote  string
	latestCents float64
	mutex       sync.Mutex
	stream      *portaudio.Stream
	pitch       *aubio.Pitch
	noiseGate   float64
	window      []float64 // Hann window
}

// NewApp creates a new App application struct
func NewApp() *App {
	app := &App{
		pitchChan: make(chan float64, 100),
		closeChan: make(chan struct{}),
		noiseGate: 0.005,
		window:    make([]float64, bufSize),
	}

	// Calculate Hann window
	for i := 0; i < bufSize; i++ {
		app.window[i] = 0.5 * (1 - math.Cos(2*math.Pi*float64(i)/float64(bufSize-1)))
	}

	return app
}

// startup is called at application startup
func (a *App) startup(ctx context.Context) {
	a.ctx = ctx
	err := portaudio.Initialize()
	if err != nil {
		fmt.Println("Error initializing PortAudio:", err)
	}
}

// domReady is called after the front-end dom has been loaded
func (a *App) domReady(ctx context.Context) {
	// Add your action here
}

// shutdown is called at application termination
func (a *App) shutdown(ctx context.Context) {
	if a.isDetecting {
		a.StopPitchDetection()
	}
	portaudio.Terminate()
}

// StartPitchDetection starts the pitch detection process
func (a *App) StartPitchDetection() string {
	a.mutex.Lock()
	defer a.mutex.Unlock()

	if a.isDetecting {
		return "Pitch detection is already running"
	}

	a.pitch = aubio.NewPitch(aubio.PitchYin, bufSize, bufSize, sampleRate)
	a.isDetecting = true
	a.closeChan = make(chan struct{})
	go a.detectPitch()
	return "Pitch detection started"
}

// StopPitchDetection stops the pitch detection process
func (a *App) StopPitchDetection() string {
	a.mutex.Lock()
	defer a.mutex.Unlock()

	if !a.isDetecting {
		return "Pitch detection is not running"
	}

	a.isDetecting = false
	close(a.closeChan)
	if a.stream != nil {
		a.stream.Stop()
		a.stream.Close()
		a.stream = nil
	}
	if a.pitch != nil {
		a.pitch.Free()
		a.pitch = nil
	}
	return "Pitch detection stopped"
}

func (a *App) detectPitch() {
	defer func() {
		if r := recover(); r != nil {
			fmt.Println("Recovered from panic in detectPitch:", r)
		}
	}()

	var err error
	a.stream, err = portaudio.OpenDefaultStream(1, 0, float64(sampleRate), bufSize, func(in []float32) {
		if a.pitch == nil {
			return
		}
		data := make([]float64, len(in))

		// Calculate RMS (Root Mean Square) for volume
		var sum float64
		for i, v := range in {
			data[i] = float64(v)
			sum += float64(v) * float64(v)
		}
		rms := math.Sqrt(sum / float64(len(in)))

		// Apply noise gate
		if rms > a.noiseGate {
			// Apply windowing
			for i := 0; i < bufSize; i++ {
				data[i] *= a.window[i]
			}

			buf := aubio.NewSimpleBufferData(bufSize, data)
			defer buf.Free()

			a.pitch.Do(buf)
			pitch := a.pitch.Buffer().Slice()[0]

			if pitch != 0 {
				select {
				case a.pitchChan <- pitch:
				default:
					// Channel is full, discard the pitch
				}
			}
		}
	})

	if err != nil {
		fmt.Println("Error opening stream:", err)
		return
	}

	if err := a.stream.Start(); err != nil {
		fmt.Println("Error starting stream:", err)
		return
	}

	sigChan := make(chan os.Signal, 1)
	signal.Notify(sigChan, syscall.SIGINT, syscall.SIGTERM)

	for {
		select {
		case pitch := <-a.pitchChan:
			a.latestPitch = pitch
			a.latestNote = a.findClosestNote(pitch)
			a.latestCents = a.calculateCents(pitch, a.latestNote)
		case <-a.closeChan:
			return
		case <-sigChan:
			return
		}
	}
}

func (a *App) findClosestNote(pitch float64) string {
	var minDiff float64 = math.MaxFloat64
	var closestNote string
	for note, freq := range NoteMap {
		diff := math.Abs(pitch - freq)
		if diff < minDiff {
			minDiff = diff
			closestNote = note
		}
	}
	return closestNote
}

func (a *App) calculateCents(pitch float64, note string) float64 {
	noteFreq := a.getNoteFrequency(note)
	if noteFreq == 0 {
		return 0 // Avoid division by zero
	}
	return 1200 * math.Log2(pitch/noteFreq)
}

func (a *App) getNoteFrequency(note string) float64 {
	if freq, ok := NoteMap[note]; ok {
		return freq
	}
	return 0 // Return 0 if note is not found
}

// GetLatestPitch returns the most recent detected pitch
func (a *App) GetLatestPitch() float64 {
	return a.latestPitch
}

// GetLatestNote returns the most recent detected note
func (a *App) GetLatestNote() string {
	return a.latestNote
}

// GetLatestCents returns the cents off from the latest detected note
func (a *App) GetLatestCents() float64 {
	return a.latestCents
}

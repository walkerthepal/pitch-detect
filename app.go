package main

import (
	"context"
	"fmt"
	"math"
	"os"
	"os/signal"
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
}

// NewApp creates a new App application struct
func NewApp() *App {
	return &App{
		pitchChan: make(chan float64, 100),
		closeChan: make(chan struct{}),
	}
}

// startup is called at application startup
func (a *App) startup(ctx context.Context) {
	// Perform your setup here
	a.ctx = ctx
}

// domReady is called after the front-end dom has been loaded
func (a *App) domReady(ctx context.Context) {
	// Add your action here
}

// shutdown is called at application termination
func (a *App) shutdown(ctx context.Context) {
	// Perform your teardown here
	if a.isDetecting {
		a.StopPitchDetection()
	}
}

// StartPitchDetection starts the pitch detection process
func (a *App) StartPitchDetection() string {
	if a.isDetecting {
		return "Pitch detection is already running"
	}

	a.isDetecting = true
	go a.detectPitch()
	return "Pitch detection started"
}

// StopPitchDetection stops the pitch detection process
func (a *App) StopPitchDetection() string {
	if !a.isDetecting {
		return "Pitch detection is not running"
	}

	a.isDetecting = false
	close(a.closeChan)
	return "Pitch detection stopped"
}

// GetLatestPitch returns the most recent detected pitch
func (a *App) GetLatestPitch() float64 {
	return a.latestPitch
}

// GetLatestNote returns the most recent detected note
func (a *App) GetLatestNote() string {
	return a.latestNote
}

func (a *App) detectPitch() {
	p := aubio.NewPitch(aubio.PitchYin, bufSize, bufSize, sampleRate)
	defer p.Free()

	portaudio.Initialize()
	defer portaudio.Terminate()

	stream, err := portaudio.OpenDefaultStream(1, 0, float64(sampleRate), bufSize, func(in []float32) {
		data := make([]float64, len(in))
		for i, v := range in {
			data[i] = float64(v)
		}

		buf := aubio.NewSimpleBufferData(bufSize, data)
		defer buf.Free()

		p.Do(buf)
		pitch := p.Buffer().Slice()[0]

		if pitch != 0 {
			a.pitchChan <- pitch
		}
	})

	if err != nil {
		fmt.Println("Error opening stream:", err)
		return
	}
	defer stream.Close()

	if err := stream.Start(); err != nil {
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
		case <-a.closeChan:
			stream.Stop()
			return
		case <-sigChan:
			stream.Stop()
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

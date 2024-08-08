import React, { useState, useEffect } from 'react';
import { StartPitchDetection, StopPitchDetection, GetLatestPitch, GetLatestNote } from '../wailsjs/go/main/App';

const PitchTuningNeedle = () => {
  const [pitch, setPitch] = useState(440);
  const [note, setNote] = useState('A4');
  const [isDetecting, setIsDetecting] = useState(false);
  const minPitch = 16.3516;  // C0
  const maxPitch = 2093.0044;  // C7

  useEffect(() => {
    let interval;
    if (isDetecting) {
      interval = setInterval(async () => {
        const latestPitch = await GetLatestPitch();
        const latestNote = await GetLatestNote();
        setPitch(latestPitch);
        setNote(latestNote);
      }, 100);
    }
    return () => clearInterval(interval);
  }, [isDetecting]);

  const handleStartDetection = async () => {
    await StartPitchDetection();
    setIsDetecting(true);
  };

  const handleStopDetection = async () => {
    await StopPitchDetection();
    setIsDetecting(false);
  };

  const rotation = (Math.log(pitch / minPitch) / Math.log(maxPitch / minPitch)) * 180 - 90;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100vh' }}>
      <div style={{ position: 'relative', width: 300, height: 300 }}>
        <div style={{ position: 'absolute', top: -40, width: '100%', textAlign: 'center', fontSize: '32px', fontWeight: 'bold' }}>
          {note}
        </div>
        <svg width="300" height="300" viewBox="-150 -150 300 300">
          {/* Gauge background */}
          <path
            d="M-100,0 A100,100 0 0,1 100,0"
            fill="none"
            stroke="#ddd"
            strokeWidth="20"
          />
          
          {/* Needle */}
          <line
            x1="0"
            y1="0"
            x2="0"
            y2="-90"
            stroke="red"
            strokeWidth="4"
            transform={`rotate(${rotation})`}
          >
            <animateTransform
              attributeName="transform"
              type="rotate"
              from={`${rotation - 5} 0 0`}
              to={`${rotation} 0 0`}
              dur="0.2s"
              repeatCount="1"
            />
          </line>
          
          {/* Center point */}
          <circle cx="0" cy="0" r="5" fill="black" />
          
          {/* Labels */}
          <text x="-110" y="30" textAnchor="middle">C0</text>
          <text x="0" y="30" textAnchor="middle">C4</text>
          <text x="110" y="30" textAnchor="middle">C7</text>
        </svg>
        <div style={{ position: 'absolute', bottom: -30, width: '100%', textAlign: 'center', fontSize: '18px' }}>
          Current Pitch: {pitch.toFixed(2)} Hz
        </div>
      </div>
      <div style={{ marginTop: '40px', display: 'flex', justifyContent: 'center' }}>
        <button onClick={isDetecting ? handleStopDetection : handleStartDetection}>
          {isDetecting ? 'Stop Detection' : 'Start Detection'}
        </button>
      </div>
    </div>
  );
};

export default PitchTuningNeedle;
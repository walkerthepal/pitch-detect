import React, { useState, useEffect, useRef } from 'react';
import { StartPitchDetection, StopPitchDetection, GetLatestPitch, GetLatestNote, GetLatestCents } from '../wailsjs/go/main/App';

const PitchTuningNeedle = () => {
  const [note, setNote] = useState('A4');
  const [isDetecting, setIsDetecting] = useState(false);
  const [needleRotation, setNeedleRotation] = useState(0);
  
  const rotationBuffer = useRef([]);
  const BUFFER_SIZE = 15; // Increased to 20 for smoother movement

  useEffect(() => {
    let intervalId;

    const updateTuner = async () => {
      if (isDetecting) {
        const [latestPitch, latestNote, latestCents] = await Promise.all([
          GetLatestPitch(),
          GetLatestNote(),
          GetLatestCents()
        ]);

        setNote(latestNote);

        // Add new rotation to buffer
        rotationBuffer.current.push(latestCents * 1.8);
        if (rotationBuffer.current.length > BUFFER_SIZE) {
          rotationBuffer.current.shift();
        }

        // Calculate average rotation
        const averageRotation = rotationBuffer.current.reduce((a, b) => a + b, 0) / rotationBuffer.current.length;
        setNeedleRotation(averageRotation);
      }
    };

    if (isDetecting) {
      intervalId = setInterval(updateTuner, 100);
    } else {
      // Reset buffer when stopping detection
      rotationBuffer.current = [];
    }

    return () => clearInterval(intervalId);
  }, [isDetecting]);

  const handleToggleDetection = async () => {
    try {
      setIsDetecting((prevState) => {
        if (prevState) {
          StopPitchDetection();
        } else {
          StartPitchDetection();
        }
        return !prevState;
      });
    } catch (error) {
      console.error("Error toggling pitch detection:", error);
    }
  };

  return (
    <div style={{ 
      display: 'flex', 
      flexDirection: 'column', 
      alignItems: 'center', 
      justifyContent: 'center', 
      height: '100vh',
      width: '100%',
      padding: '20px',
      boxSizing: 'border-box',
    }}>
      <div style={{
        padding: '30px',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        maxWidth: '400px',
        width: '100%',
      }}>
        <div style={{ fontSize: '48px', fontWeight: 'bold', marginBottom: '20px' }}>
          {note}
        </div>
        <div style={{ position: 'relative', width: 300, height: 300 }}>
          <svg width="300" height="300" viewBox="-150 -150 300 300">
            <path
              d="M-100,0 A100,100 0 0,1 100,0"
              fill="none"
              stroke="#ddd"
              strokeWidth="20"
            />
            {[-50, -40, -30, -20, -10, 0, 10, 20, 30, 40, 50].map(cent => (
              <line
                key={cent}
                x1={0}
                y1={-90}
                x2={0}
                y2={cent % 10 === 0 ? -100 : -95}
                stroke="black"
                strokeWidth="2"
                transform={`rotate(${cent * 1.8})`}
              />
            ))}
            <text x="-95" y="30" textAnchor="middle" fontSize="12">-50</text>
            <text x="0" y="30" textAnchor="middle" fontSize="12">0</text>
            <text x="95" y="30" textAnchor="middle" fontSize="12">+50</text>
            <line
              x1="0"
              y1="0"
              x2="0"
              y2="-90"
              stroke="red"
              strokeWidth="4"
              transform={`rotate(${needleRotation})`}
            />
            <circle cx="0" cy="0" r="5" fill="black" />
          </svg>
        </div>
        <div style={{ marginTop: '20px', fontSize: '18px' }}>
          Cents off: {(needleRotation / 1.8).toFixed(2)}
        </div>
        <div style={{ marginTop: '40px', display: 'flex', justifyContent: 'center' }}>
          <button
            onClick={handleToggleDetection}
            style={{
              padding: '10px 20px',
              fontSize: '16px',
              fontWeight: 'bold',
              color: 'white',
              backgroundColor: isDetecting ? '#e74c3c' : '#2ecc71',
              border: 'none',
              borderRadius: '5px',
              cursor: 'pointer',
              transition: 'background-color 0.3s, transform 0.1s',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
            onMouseDown={(e) => e.target.style.transform = 'scale(0.95)'}
            onMouseUp={(e) => e.target.style.transform = 'scale(1)'}
            onMouseLeave={(e) => e.target.style.transform = 'scale(1)'}
          >
            <span style={{ marginRight: '10px' }}>
              {isDetecting ? '◼' : '▶'}
            </span>
            {isDetecting ? 'Stop' : 'Start'} Detection
          </button>
        </div>
      </div>
    </div>
  );
};

export default PitchTuningNeedle;
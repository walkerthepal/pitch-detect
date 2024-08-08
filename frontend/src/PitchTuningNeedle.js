import React, { useState, useEffect } from 'react';
import { StartPitchDetection, StopPitchDetection, GetLatestPitch, GetLatestNote, GetLatestCents } from '../wailsjs/go/main/App';

const PitchTuningNeedle = () => {
  const [pitch, setPitch] = useState(440);
  const [note, setNote] = useState('A4');
  const [cents, setCents] = useState(0);
  const [isDetecting, setIsDetecting] = useState(false);

  useEffect(() => {
    let interval;
    if (isDetecting) {
      interval = setInterval(async () => {
        const latestPitch = await GetLatestPitch();
        const latestNote = await GetLatestNote();
        const latestCents = await GetLatestCents();
        setPitch(latestPitch);
        setNote(latestNote);
        setCents(latestCents);
      }, 100);
    }
    return () => clearInterval(interval);
  }, [isDetecting]);

  const handleToggleDetection = async () => {
    try {
      setIsDetecting((prevState) => {
        if (prevState) {
          StopPitchDetection();
        } else {
          setTimeout(() => {
            StartPitchDetection();
          }, 100); // 100ms delay before starting
        }
        return !prevState;
      });
    } catch (error) {
      console.error("Error toggling pitch detection:", error);
      // Optionally, display an error message to the user
    }
  };
  
  const rotation = cents * 1.8; // 1.8 degrees per cent (90 degrees / 50 cents)

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
          
          {/* Cent markers */}
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
          
          {/* Cent labels */}
          <text x="-95" y="30" textAnchor="middle" fontSize="12">-50</text>
          <text x="0" y="30" textAnchor="middle" fontSize="12">0</text>
          <text x="95" y="30" textAnchor="middle" fontSize="12">+50</text>
          
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
        </svg>
        <div style={{ position: 'absolute', bottom: -30, width: '100%', textAlign: 'center', fontSize: '18px' }}>
          Cents off: {cents.toFixed(2)}
        </div>
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
  );
};

export default PitchTuningNeedle;
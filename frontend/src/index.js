import React from 'react';
import * as ReactDOM from 'react-dom/client';
import PitchTuningNeedle from './PitchTuningNeedle';

const App = () => {
  return (
    <div>
      <h1>Pitch Tuner</h1>
      <PitchTuningNeedle />
    </div>
  );
};

document.addEventListener('DOMContentLoaded', () => {
  const container = document.getElementById('root');
  if (container) {
    const root = ReactDOM.createRoot(container);
    root.render(<App />);
  } else {
    console.error('Root element not found');
  }
});
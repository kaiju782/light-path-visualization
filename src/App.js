import React from 'react';
import LightPathVisualization from './components/LightPathVisualization';

function App() {
  return (
    <div className="min-h-screen bg-gray-100 py-8">
      <div className="container mx-auto">
        <h1 className="text-3xl font-bold text-center mb-8">광학 경로 시각화</h1>
        <div className="flex justify-center">
          <LightPathVisualization />
        </div>
      </div>
    </div>
  );
}

export default App;

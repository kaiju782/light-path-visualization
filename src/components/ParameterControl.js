import React from 'react';

const ParameterControl = ({ 
  label, 
  value, 
  onChange, 
  min, 
  max, 
  step,
  isLocked,
  onLockToggle
}) => {
  return (
    <div className="space-y-2">
      <div className="flex justify-between items-center">
        <label className="text-sm font-medium">{label}:</label>
        <div className="flex items-center gap-2">
          <input 
            type="number"
            value={value}
            onChange={(e) => !isLocked && onChange(Number(e.target.value))}
            className="w-20 px-2 py-1 text-sm border rounded"
            min={min}
            max={max}
            step={step}
            disabled={isLocked}
          />
          <button
            onClick={onLockToggle}
            className={`px-2 py-1 rounded text-sm ${
              isLocked ? 'bg-blue-500 text-white' : 'bg-gray-200'
            }`}
          >
            {isLocked ? '🔒' : '🔓'}
          </button>
        </div>
      </div>
      <input 
        type="range" 
        min={min} 
        max={max} 
        step={step}
        value={value}
        onChange={(e) => !isLocked && onChange(Number(e.target.value))}
        className="w-full"
        disabled={isLocked}
      />
    </div>
  );
};

export default ParameterControl; 
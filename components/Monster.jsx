import React from 'react';

export default function Monster({ progress }) {
  return (
    <div className="monster-track">
      <div className="monster" style={{ left: `${progress}%` }}>
        👾
      </div>
    </div>
  );
}

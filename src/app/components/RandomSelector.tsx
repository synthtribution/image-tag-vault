"use client";

import React, { useState } from "react";

interface RandomSelectorProps {
  onGenerate: (count: number) => void;
}

export default function RandomSelector({ onGenerate }: RandomSelectorProps) {
  const [count, setCount] = useState<number>(0);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      onGenerate(count);
    }
  };

  return (
    <div className="random-count">
      <label>
        Imágenes aleatorias:
        <input
          type="number"
          className="random-input"
          value={count === 0 ? "" : count}
          onChange={(e) => {
            const val = parseInt(e.target.value, 10);
            setCount(isNaN(val) ? 0 : val);
          }}
          onKeyDown={handleKeyDown}
          min="0"
          placeholder="0"
        />
      </label>
    </div>
  );
}

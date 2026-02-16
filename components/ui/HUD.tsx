import React from 'react';

interface HUDProps {
  score: number;
  levelName: string;
}

export const HUD: React.FC<HUDProps> = ({ score, levelName }) => {
  return (
    <div className="absolute top-0 left-0 w-full p-2 md:p-4 flex justify-between text-white font-['Press_Start_2P'] text-shadow-md pointer-events-none z-10">
      <div className="flex flex-col drop-shadow-md">
          <span className="text-yellow-400 text-xs md:text-lg">SCORE</span>
          <span className="text-lg md:text-2xl" aria-label={`Score: ${score}`}>{score.toString().padStart(6, '0')}</span>
      </div>
      <div className="flex flex-col text-right drop-shadow-md">
           <span className="text-blue-400 text-xs md:text-lg">WORLD</span>
           <span className="text-[10px] md:text-sm truncate max-w-[150px] md:max-w-none">{levelName}</span>
      </div>
    </div>
  );
};

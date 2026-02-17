import React from 'react';
import { ArrowLeft, ArrowRight, ChevronUp, Zap } from 'lucide-react';
import { GameEngine } from '../../game/GameEngine';
import { InputAction } from '../../types';

interface TouchControlsProps {
  engine: GameEngine | null;
}

export const TouchControls: React.FC<TouchControlsProps> = ({ engine }) => {
  if (!engine) return null;

  const handleStart = (action: InputAction) => (e: React.TouchEvent | React.MouseEvent) => {
    e.preventDefault(); // Prevent scrolling/context menu
    engine['input'].setVirtualAction(action, true);
  };

  const handleEnd = (action: InputAction) => (e: React.TouchEvent | React.MouseEvent) => {
    e.preventDefault();
    engine['input'].setVirtualAction(action, false);
  };

  // Helper to create button props
  const btnProps = (action: InputAction) => ({
    onTouchStart: handleStart(action),
    onTouchEnd: handleEnd(action),
    onMouseDown: handleStart(action), // For testing on desktop
    onMouseUp: handleEnd(action),
    onMouseLeave: handleEnd(action),
  });

  return (
    <div className="absolute inset-0 pointer-events-none z-20 flex flex-col justify-end p-4 md:hidden select-none">
      <div className="flex justify-between items-end w-full pb-6 safe-area-pb">

        {/* Left Hand: Movement */}
        <div className="flex gap-6 pointer-events-auto pl-4">
          <button
            className="w-20 h-20 bg-white/10 backdrop-blur-md rounded-full border-2 border-white/30 flex items-center justify-center active:bg-white/30 active:scale-95 transition-all shadow-lg active:shadow-inner touch-manipulation"
            aria-label="Left"
            {...btnProps('LEFT')}
          >
            <ArrowLeft className="text-white w-10 h-10 drop-shadow-md" />
          </button>
          <button
            className="w-20 h-20 bg-white/10 backdrop-blur-md rounded-full border-2 border-white/30 flex items-center justify-center active:bg-white/30 active:scale-95 transition-all shadow-lg active:shadow-inner touch-manipulation"
            aria-label="Right"
            {...btnProps('RIGHT')}
          >
            <ArrowRight className="text-white w-10 h-10 drop-shadow-md" />
          </button>
        </div>

        {/* Right Hand: Actions */}
        <div className="flex gap-6 pointer-events-auto items-end pr-4">
          <button
            className="w-16 h-16 bg-red-500/30 backdrop-blur-md rounded-full border-2 border-red-400/50 flex items-center justify-center active:bg-red-500/50 active:scale-95 transition-all shadow-lg active:shadow-inner mb-4 touch-manipulation"
            aria-label="Shoot"
            {...btnProps('SHOOT')}
          >
            <Zap className="text-white w-8 h-8 drop-shadow-md" />
          </button>
          <button
            className="w-24 h-24 bg-green-500/30 backdrop-blur-md rounded-full border-2 border-green-400/50 flex items-center justify-center active:bg-green-500/50 active:scale-95 transition-all shadow-lg active:shadow-inner touch-manipulation"
            aria-label="Jump"
            {...btnProps('JUMP')}
          >
            <ChevronUp className="text-white w-12 h-12 drop-shadow-md" />
          </button>
        </div>

      </div>
    </div>
  );
};

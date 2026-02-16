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
    <div className="absolute inset-0 pointer-events-none z-20 flex flex-col justify-end p-4 md:hidden">
      <div className="flex justify-between items-end w-full pb-4">
        
        {/* Left Hand: Movement */}
        <div className="flex gap-4 pointer-events-auto">
          <button 
            className="w-16 h-16 bg-white/20 backdrop-blur-sm rounded-full border-2 border-white/50 flex items-center justify-center active:bg-white/40 active:scale-95 transition-all"
            aria-label="Left"
            {...btnProps('LEFT')}
          >
            <ArrowLeft className="text-white w-8 h-8" />
          </button>
          <button 
            className="w-16 h-16 bg-white/20 backdrop-blur-sm rounded-full border-2 border-white/50 flex items-center justify-center active:bg-white/40 active:scale-95 transition-all"
            aria-label="Right"
            {...btnProps('RIGHT')}
          >
            <ArrowRight className="text-white w-8 h-8" />
          </button>
        </div>

        {/* Right Hand: Actions */}
        <div className="flex gap-4 pointer-events-auto items-end">
           <button 
            className="w-14 h-14 bg-red-500/40 backdrop-blur-sm rounded-full border-2 border-red-300/50 flex items-center justify-center active:bg-red-500/60 active:scale-95 transition-all mb-2"
            aria-label="Shoot"
            {...btnProps('SHOOT')}
          >
            <Zap className="text-white w-6 h-6" />
          </button>
          <button 
            className="w-20 h-20 bg-green-500/40 backdrop-blur-sm rounded-full border-2 border-green-300/50 flex items-center justify-center active:bg-green-500/60 active:scale-95 transition-all"
            aria-label="Jump"
            {...btnProps('JUMP')}
          >
            <ChevronUp className="text-white w-10 h-10" />
          </button>
        </div>

      </div>
    </div>
  );
};

import React from 'react';
import { RotateCcw, Trophy } from 'lucide-react';

interface GameOverProps {
  score: number;
  highScore: number;
  onMenu: () => void;
  isVictory?: boolean;
}

export const GameOver: React.FC<GameOverProps> = ({ score, highScore, onMenu, isVictory }) => {
  return (
    <div className={`absolute inset-0 ${isVictory ? 'bg-yellow-900/90' : 'bg-red-950/90'} flex flex-col items-center justify-center text-white z-50 backdrop-blur-sm`}>
       {isVictory && <Trophy size={64} className="text-yellow-400 mb-4" />}
       <h2 className={`text-4xl md:text-5xl ${isVictory ? 'text-yellow-400' : 'text-red-500'} mb-6 font-['Press_Start_2P'] drop-shadow-[4px_4px_0_rgba(0,0,0,1)] text-center`}>
           {isVictory ? 'COURSE CLEAR!' : 'GAME OVER'}
       </h2>
       
       <div className={`bg-black/40 p-6 rounded-lg border ${isVictory ? 'border-yellow-500/30' : 'border-red-500/30'} mb-8 text-center min-w-[250px]`}>
           <p className="text-gray-400 text-sm mb-2">{isVictory ? 'FINAL SCORE' : 'SCORE'}</p>
           <p className="text-3xl text-white mb-4">{score}</p>
           <div className="w-full h-px bg-gray-600 mb-4"></div>
           {isVictory ? (
                <p className="text-green-400 text-xs">BOSS DEFEATED!</p>
           ) : (
                <>
                    <p className="text-gray-400 text-xs mb-1">HIGH SCORE</p>
                    <p className="text-xl text-yellow-400">{highScore}</p>
                </>
           )}
       </div>
       
       <button 
          onClick={onMenu}
          className="bg-white text-black hover:bg-gray-200 font-bold py-3 px-8 rounded shadow-[0_4px_0_#999] active:shadow-none active:translate-y-1 transition-all flex items-center gap-2 font-['Press_Start_2P'] text-xs"
          autoFocus
        >
          <RotateCcw size={16} /> {isVictory ? 'NEXT RACE' : 'MENU'}
        </button>
    </div>
  );
};

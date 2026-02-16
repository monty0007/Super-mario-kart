import React from 'react';
import { Map, Palette, Zap, Play, Loader2 } from 'lucide-react';
import { LevelConfig } from '../../types';
import { CAR_COLORS } from '../../constants';

interface MainMenuProps {
  levelData: LevelConfig;
  presetLevels: LevelConfig[];
  selectedColor: string;
  prompt: string;
  isLoading: boolean;
  onLevelSelect: (e: React.ChangeEvent<HTMLSelectElement>) => void;
  onColorSelect: (color: string) => void;
  onPromptChange: (val: string) => void;
  onGenerate: () => void;
  onStart: () => void;
}

export const MainMenu: React.FC<MainMenuProps> = ({
  levelData,
  presetLevels,
  selectedColor,
  prompt,
  isLoading,
  onLevelSelect,
  onColorSelect,
  onPromptChange,
  onGenerate,
  onStart
}) => {
  return (
    <div className="absolute inset-0 bg-black/70 flex flex-col items-center justify-center text-white backdrop-blur-sm z-20 overflow-y-auto py-8">
      <h1 className="text-4xl md:text-5xl text-transparent bg-clip-text bg-gradient-to-b from-yellow-400 to-yellow-600 mb-6 font-['Press_Start_2P'] tracking-tighter text-center drop-shadow-[4px_4px_0_rgba(0,0,0,1)] stroke-black" style={{ WebkitTextStroke: '2px black' }}>
        SUPER KART<br/>BROS
      </h1>
      
      <div className="flex flex-col md:flex-row gap-4 w-full max-w-3xl px-4">
          <div className="flex-1 space-y-4">
              <div className="bg-gray-800/90 p-5 rounded-lg border-2 border-white/20 shadow-xl">
                  <div className="flex items-center gap-2 mb-3">
                      <Map className="text-blue-400" size={18} />
                      <h2 className="text-sm font-bold text-blue-200">Select Track</h2>
                  </div>
                  
                  <select 
                      className="w-full bg-gray-900 border border-gray-600 text-white rounded p-3 mb-2 font-['Press_Start_2P'] text-[10px] focus:ring-2 focus:ring-green-500 outline-none"
                      onChange={onLevelSelect}
                      value={levelData.id.startsWith('gen') ? '' : levelData.id}
                      aria-label="Select Game Level"
                  >
                      {presetLevels.map(l => (
                          <option key={l.id} value={l.id}>{l.name} [{l.difficulty}]</option>
                      ))}
                      {levelData.id.startsWith('gen') && <option value={levelData.id}>✨ {levelData.name}</option>}
                  </select>

                  <p className="text-gray-400 text-[10px] italic bg-black/20 p-2 rounded h-12 overflow-hidden">
                      "{levelData.description}"
                  </p>
              </div>

              <div className="bg-gray-800/90 p-5 rounded-lg border-2 border-white/20 shadow-xl">
                   <div className="flex items-center gap-2 mb-3">
                      <Palette className="text-pink-400" size={18} />
                      <h2 className="text-sm font-bold text-pink-200">Kart Color</h2>
                  </div>
                  <div className="grid grid-cols-4 gap-2" role="radiogroup" aria-label="Select Kart Color">
                      {CAR_COLORS.map((c) => (
                          <button
                              key={c.value}
                              onClick={() => onColorSelect(c.value)}
                              className={`w-full aspect-square rounded border-2 transition-all ${selectedColor === c.value ? 'border-white scale-110 shadow-[0_0_10px_white]' : 'border-transparent opacity-80 hover:opacity-100'}`}
                              style={{ backgroundColor: c.value }}
                              title={c.name}
                              aria-label={`Select ${c.name}`}
                              aria-checked={selectedColor === c.value}
                              role="radio"
                          />
                      ))}
                  </div>
              </div>
          </div>

          <div className="flex-1 space-y-4 flex flex-col">
               <div className="bg-gradient-to-r from-purple-900/80 to-indigo-900/80 p-5 rounded-lg border-2 border-purple-500/30 shadow-lg">
                  <label htmlFor="ai-prompt" className="text-[10px] text-purple-200 mb-2 flex items-center gap-2 font-bold">
                      <Zap size={14} />
                      AI TRACK GENERATOR
                  </label>
                  <div className="flex gap-2">
                      <input 
                      id="ai-prompt"
                      type="text" 
                      value={prompt}
                      onChange={(e) => onPromptChange(e.target.value)}
                      placeholder="e.g. 'Ice world hard'"
                      className="flex-1 bg-black/40 border border-purple-500/50 rounded px-3 py-2 text-[10px] focus:outline-none focus:border-purple-400 text-white placeholder-gray-500"
                      />
                      <button 
                      onClick={onGenerate}
                      disabled={isLoading || !prompt}
                      className="bg-purple-600 hover:bg-purple-500 disabled:opacity-50 text-white px-3 py-2 rounded font-bold shadow-[0_4px_0_rgb(107,33,168)] active:shadow-none active:translate-y-1 transition-all flex items-center justify-center"
                      aria-label="Generate Level"
                      >
                      {isLoading ? <Loader2 className="animate-spin" size={16} /> : "GEN"}
                      </button>
                  </div>
              </div>

              <button 
                  onClick={onStart}
                  className="flex-1 bg-green-600 hover:bg-green-500 text-white font-bold py-6 rounded-lg shadow-[0_6px_0_rgb(21,128,61)] active:shadow-[0_2px_0_rgb(21,128,61)] active:translate-y-1 transition-all flex items-center justify-center gap-3 text-xl animate-pulse"
                  aria-label="Start Race"
              >
                  <Play size={32} fill="currentColor" /> RACE!
              </button>
          </div>
      </div>
    </div>
  );
};

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

export const MainMenu: React.FC<MainMenuProps> = React.memo(({
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
        <div className="absolute inset-0 bg-gradient-to-b from-[#5c94fc] to-[#85b6ff] flex flex-col items-center justify-center text-white z-20 overflow-y-auto py-4 md:py-8 font-sans">

            {/* Checkerboard Pattern Overlay */}
            <div className="absolute inset-0 opacity-10 pointer-events-none"
                style={{
                    backgroundImage: 'linear-gradient(45deg, #000 25%, transparent 25%, transparent 75%, #000 75%, #000), linear-gradient(45deg, #000 25%, transparent 25%, transparent 75%, #000 75%, #000)',
                    backgroundSize: '60px 60px',
                    backgroundPosition: '0 0, 30px 30px'
                }}
            />

            {/* Hills Bottom Decoration */}
            <div className="absolute bottom-0 left-0 right-0 h-32 md:h-48 opacity-80 pointer-events-none bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAxNDQwIDMyMCI+PHBhdGggZmlsbD0iIzAwYjE0MCIgZmlsbC1vcGFjaXR5PSIxIiBkPSJNMCAyMjRMMzAgMjEzLjNDNjAgMjAzIDEyMCAxODEgMTgwIDE5MkMyNDAgMjAzIDMwMCAyNDUgMzYwIDI2MS4zQzQyMCAyNzcgNDgwIDI2NyA1NDAgMjM0LjdDNjAwIDIwMyA2NjAgMTQ5IDcyMCAxNDkuM0M3ODAgMTQ5IDg0MCAyMDMgOTAwIDIyOS4zQOTYwIDI1NiAxMDIwIDI1NiAxMDgwIDIyOS4zQzExNDAgMjAzIDEyMDAgMTQ5IDEyNjAgMTI4QzEzMjAgMTA3IDEzODAgMTE3IDE0MTAgMTIyLjdMMTQ0MCAxMjhMMTQ0MCAzMjBMMTQxMCAzMjBDMTM4MCAzMjAgMTMyMCAzMjAgMTI2MCAzMjBDMTIwMCAzMjAgMTE0MCAzMjAgMTA4MCAzMjBDMTAyMCAzMjAgOTYwIDMyMCA5MDAgMzIwQzg0MCAzMjAgNzgwIDMyMCA3MjAgMzIwQzY2MCAzMjAgNjAwIDMyMCA1NDAgMzIwQzQ4MCAzMjAgNDIwIDMyMCAzNjAgMzIwQzMwMCAzMjAgMjQwIDMyMCAxODAgMzIwQzEyMCAzMjAgNjAgMzIwIDMwIDMyMEwwIDMyMFoiPjwvcGF0aD48L3N2Zz4=')] bg-repeat-x bg-bottom bg-contain" />

            <h1 className="relative z-10 text-3xl md:text-6xl text-transparent bg-clip-text bg-gradient-to-b from-yellow-300 to-orange-500 mb-4 md:mb-8 font-['Press_Start_2P'] tracking-tighter text-center drop-shadow-[4px_4px_0_rgba(0,0,0,1)] stroke-black" style={{ WebkitTextStroke: '1.5px black' }}>
                SUPER KART<br />BROS
            </h1>

            <div className="flex flex-col md:flex-row gap-2 md:gap-4 w-full max-w-3xl px-4 text-xs md:text-sm">
                <div className="flex-1 space-y-2 md:space-y-4">
                    <div className="bg-gray-800/90 p-3 md:p-5 rounded-lg border-2 border-white/20 shadow-xl">
                        <div className="flex items-center gap-2 mb-2 md:mb-3">
                            <Map className="text-blue-400" size={16} aria-hidden="true" />
                            <h2 className="font-bold text-blue-200" id="select-track-label">Select Track</h2>
                        </div>

                        <select
                            className="w-full bg-gray-900 border border-gray-600 text-white rounded p-2 mb-2 font-['Press_Start_2P'] text-[10px] focus:ring-2 focus:ring-green-500 outline-none"
                            onChange={onLevelSelect}
                            value={levelData.id.startsWith('gen') ? '' : levelData.id}
                            aria-labelledby="select-track-label"
                        >
                            {presetLevels.map(l => (
                                <option key={l.id} value={l.id}>{l.name} [{l.difficulty}]</option>
                            ))}
                            {levelData.id.startsWith('gen') && <option value={levelData.id}>✨ {levelData.name}</option>}
                        </select>

                        <p className="text-gray-400 text-[9px] md:text-[10px] italic bg-black/20 p-2 rounded h-10 md:h-12 overflow-hidden leading-tight">
                            "{levelData.description}"
                        </p>
                    </div>

                    <div className="bg-gray-800/90 p-3 md:p-5 rounded-lg border-2 border-white/20 shadow-xl">
                        <div className="flex items-center gap-2 mb-2 md:mb-3">
                            <Palette className="text-pink-400" size={16} aria-hidden="true" />
                            <h2 className="font-bold text-pink-200" id="kart-color-label">Kart Color</h2>
                        </div>
                        <div className="grid grid-cols-4 gap-2" role="radiogroup" aria-labelledby="kart-color-label">
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

                <div className="flex-1 space-y-2 md:space-y-4 flex flex-col">
                    <div className="bg-gradient-to-r from-purple-900/80 to-indigo-900/80 p-3 md:p-5 rounded-lg border-2 border-purple-500/30 shadow-lg">
                        <label htmlFor="ai-prompt" className="text-[10px] text-purple-200 mb-2 flex items-center gap-2 font-bold">
                            <Zap size={14} aria-hidden="true" />
                            AI TRACK GENERATOR
                        </label>
                        <div className="flex gap-2">
                            <input
                                id="ai-prompt"
                                type="text"
                                value={prompt}
                                onChange={(e) => onPromptChange(e.target.value)}
                                placeholder="e.g. 'Ice world hard'"
                                className="flex-1 bg-black/40 border border-purple-500/50 rounded px-2 py-1 md:px-3 md:py-2 text-[10px] focus:outline-none focus:border-purple-400 text-white placeholder-gray-500"
                                aria-label="AI Prompt Input"
                            />
                            <button
                                onClick={onGenerate}
                                disabled={isLoading || !prompt}
                                className="bg-purple-600 hover:bg-purple-500 disabled:opacity-50 text-white px-2 py-1 md:px-3 md:py-2 rounded font-bold shadow-[0_2px_0_rgb(107,33,168)] md:shadow-[0_4px_0_rgb(107,33,168)] active:shadow-none active:translate-y-1 transition-all flex items-center justify-center"
                                aria-label="Generate Level"
                            >
                                {isLoading ? <Loader2 className="animate-spin" size={14} aria-hidden="true" /> : "GEN"}
                            </button>
                        </div>
                    </div>

                    <button
                        onClick={onStart}
                        className="flex-1 bg-green-600 hover:bg-green-500 text-white font-bold py-4 md:py-6 rounded-lg shadow-[0_4px_0_rgb(21,128,61)] md:shadow-[0_6px_0_rgb(21,128,61)] active:shadow-[0_2px_0_rgb(21,128,61)] active:translate-y-1 transition-all flex items-center justify-center gap-2 md:gap-3 text-lg md:text-xl animate-pulse"
                        aria-label="Start Race"
                    >
                        <Play size={24} className="md:w-8 md:h-8" fill="currentColor" aria-hidden="true" /> RACE!
                    </button>
                </div>
            </div>
        </div>
    );
});

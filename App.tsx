import React, { useState, useEffect } from 'react';
import { GameState, LevelConfig, ObstacleType } from './types';
import GameCanvas from './components/GameCanvas';
import { generateLevel } from './services/geminiService';
import { Loader2, Zap, Play, RotateCcw, Map } from 'lucide-react';

const PRESET_LEVELS: LevelConfig[] = [
  {
    id: 'classic_1_1',
    name: "Classic 1-1",
    difficulty: "Easy",
    description: "The legendary beginning. A faithful recreation of the classic map.",
    theme: 'OVERWORLD',
    obstacles: [
       ObstacleType.QUESTION_BLOCK, ObstacleType.COIN, ObstacleType.BLOCK, ObstacleType.QUESTION_BLOCK, ObstacleType.BLOCK, ObstacleType.PIPE,
       ObstacleType.GOOMBA, ObstacleType.PIPE, ObstacleType.PIPE, ObstacleType.COIN,
       ObstacleType.GAP, ObstacleType.BLOCK, ObstacleType.SHELL, ObstacleType.QUESTION_BLOCK, ObstacleType.GOOMBA,
       ObstacleType.PIPE, ObstacleType.COIN, ObstacleType.PIPE, ObstacleType.GOOMBA, ObstacleType.GAP,
       ObstacleType.BLOCK, ObstacleType.SHELL, ObstacleType.BLOCK, ObstacleType.GAP, ObstacleType.GOOMBA,
       ObstacleType.PIPE, ObstacleType.COIN, ObstacleType.COIN, ObstacleType.BLOCK, ObstacleType.QUESTION_BLOCK
    ]
  },
  {
    id: 'dungeon_1_2',
    name: "Deep Dungeon",
    difficulty: "Medium",
    description: "Underground blues. Watch your head!",
    theme: 'UNDERGROUND',
    obstacles: [
        ObstacleType.BLOCK, ObstacleType.BLOCK, ObstacleType.BLOCK, ObstacleType.GAP, 
        ObstacleType.PIPE, ObstacleType.SHELL, ObstacleType.BLOCK, ObstacleType.COIN,
        ObstacleType.GAP, ObstacleType.PIPE, ObstacleType.PIPE, ObstacleType.GOOMBA,
        ObstacleType.QUESTION_BLOCK, ObstacleType.COIN, ObstacleType.GAP, ObstacleType.BLOCK
    ]
  },
  {
    id: 'castle_1_4',
    name: "Bowser's Road",
    difficulty: "Hard",
    description: "Intense heat and tricky jumps.",
    theme: 'CASTLE',
    obstacles: [
        ObstacleType.GAP, ObstacleType.GAP, ObstacleType.BLOCK, ObstacleType.GAP,
        ObstacleType.PIPE, ObstacleType.SHELL, ObstacleType.SHELL, ObstacleType.GAP,
        ObstacleType.BLOCK, ObstacleType.QUESTION_BLOCK, ObstacleType.GAP, ObstacleType.GAP,
        ObstacleType.PIPE, ObstacleType.COIN, ObstacleType.BLOCK, ObstacleType.GOOMBA
    ]
  }
];

function App() {
  const [gameState, setGameState] = useState<GameState>(GameState.MENU);
  const [levelData, setLevelData] = useState<LevelConfig>(PRESET_LEVELS[0]);
  const [prompt, setPrompt] = useState<string>('');
  const [score, setScore] = useState(0);
  const [highScore, setHighScore] = useState(0);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
      const saved = localStorage.getItem('kart_highscore');
      if (saved) setHighScore(parseInt(saved));
  }, []);

  useEffect(() => {
      if (score > highScore) {
          setHighScore(score);
          localStorage.setItem('kart_highscore', score.toString());
      }
  }, [score, highScore]);

  const handleStartGame = () => {
    setGameState(GameState.PLAYING);
  };

  const handleLevelSelect = (e: React.ChangeEvent<HTMLSelectElement>) => {
      const selected = PRESET_LEVELS.find(l => l.id === e.target.value);
      if (selected) setLevelData(selected);
  };

  const handleGenerateLevel = async () => {
    if (!prompt.trim()) return;
    
    setIsLoading(true);
    setGameState(GameState.GENERATING);
    try {
        const newLevel = await generateLevel(prompt);
        setLevelData(newLevel);
        setGameState(GameState.MENU);
    } catch (e) {
        console.error(e);
        setGameState(GameState.MENU);
    } finally {
        setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-900 flex items-center justify-center p-4">
      <div className="relative w-full max-w-4xl aspect-[4/3] bg-black rounded-xl overflow-hidden shadow-2xl border-4 border-gray-800">
        
        {/* Game Canvas */}
        <GameCanvas 
          gameState={gameState} 
          setGameState={setGameState} 
          levelData={levelData}
          onScoreUpdate={setScore}
        />

        {/* UI Overlay: HUD */}
        {gameState === GameState.PLAYING && (
          <div className="absolute top-0 left-0 w-full p-4 flex justify-between text-white font-['Press_Start_2P'] text-shadow-md pointer-events-none z-10">
            <div className="flex flex-col drop-shadow-md">
                <span className="text-yellow-400 text-lg">SCORE</span>
                <span className="text-2xl">{score.toString().padStart(6, '0')}</span>
            </div>
            <div className="flex flex-col text-right drop-shadow-md">
                 <span className="text-blue-400 text-lg">WORLD</span>
                 <span className="text-sm">{levelData.name}</span>
            </div>
          </div>
        )}

        {/* UI Overlay: Menu */}
        {gameState === GameState.MENU && (
          <div className="absolute inset-0 bg-black/70 flex flex-col items-center justify-center text-white backdrop-blur-sm z-20">
            <h1 className="text-4xl md:text-6xl text-transparent bg-clip-text bg-gradient-to-b from-yellow-400 to-yellow-600 mb-8 font-['Press_Start_2P'] tracking-tighter text-center drop-shadow-[4px_4px_0_rgba(0,0,0,1)] stroke-black" style={{ WebkitTextStroke: '2px black' }}>
              SUPER KART<br/>BROS
            </h1>
            
            <div className="bg-gray-800/90 p-6 rounded-lg border-2 border-white/20 max-w-md w-full mb-6 shadow-xl">
              <div className="flex items-center gap-2 mb-4">
                 <Map className="text-blue-400" />
                 <h2 className="text-lg font-bold text-blue-200">Select Track</h2>
              </div>
              
              <select 
                className="w-full bg-gray-900 border border-gray-600 text-white rounded p-3 mb-4 font-['Press_Start_2P'] text-xs focus:ring-2 focus:ring-green-500 outline-none"
                onChange={handleLevelSelect}
                value={levelData.id.startsWith('gen') ? '' : levelData.id}
              >
                 {PRESET_LEVELS.map(l => (
                     <option key={l.id} value={l.id}>{l.name} - {l.difficulty}</option>
                 ))}
                 {levelData.id.startsWith('gen') && <option value={levelData.id}>✨ {levelData.name}</option>}
              </select>

              <p className="text-gray-400 text-xs mb-4 min-h-[40px] italic bg-black/20 p-2 rounded">
                  "{levelData.description}"
              </p>

              
              <button 
                onClick={handleStartGame}
                className="w-full bg-green-600 hover:bg-green-500 text-white font-bold py-4 rounded shadow-[0_4px_0_rgb(21,128,61)] active:shadow-[0_0px_0_rgb(21,128,61)] active:translate-y-1 transition-all flex items-center justify-center gap-3 text-lg"
              >
                <Play size={24} fill="currentColor" /> START ENGINE
              </button>
            </div>

            <div className="bg-gradient-to-r from-purple-900/80 to-indigo-900/80 p-6 rounded-lg border-2 border-purple-500/30 max-w-md w-full shadow-lg">
              <label className="text-xs text-purple-200 mb-2 flex items-center gap-2">
                  <Zap size={14} />
                  CREATE CUSTOM TRACK (GEMINI AI)
              </label>
              <div className="flex gap-2">
                <input 
                  type="text" 
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  placeholder="e.g. 'Bowser castle with many gaps'"
                  className="flex-1 bg-black/40 border border-purple-500/50 rounded px-3 py-2 text-xs focus:outline-none focus:border-purple-400 text-white placeholder-gray-500"
                />
                <button 
                  onClick={handleGenerateLevel}
                  disabled={isLoading || !prompt}
                  className="bg-purple-600 hover:bg-purple-500 disabled:opacity-50 text-white px-4 py-2 rounded font-bold shadow-[0_4px_0_rgb(107,33,168)] active:shadow-none active:translate-y-1 transition-all flex items-center justify-center min-w-[50px]"
                >
                  {isLoading ? <Loader2 className="animate-spin" size={18} /> : "GO"}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* UI Overlay: Generating */}
        {gameState === GameState.GENERATING && (
          <div className="absolute inset-0 bg-black/90 flex flex-col items-center justify-center text-white z-50">
             <Loader2 size={64} className="animate-spin text-purple-500 mb-4" />
             <p className="text-xl animate-pulse font-['Press_Start_2P'] text-center px-4 leading-relaxed">
                 CONSTRUCTING<br/>WORLD...
             </p>
          </div>
        )}

        {/* UI Overlay: Game Over */}
        {gameState === GameState.GAME_OVER && (
           <div className="absolute inset-0 bg-red-950/90 flex flex-col items-center justify-center text-white z-50 backdrop-blur-sm">
             <h2 className="text-4xl md:text-5xl text-red-500 mb-6 font-['Press_Start_2P'] drop-shadow-[4px_4px_0_rgba(0,0,0,1)]">GAME OVER</h2>
             
             <div className="bg-black/40 p-6 rounded-lg border border-red-500/30 mb-8 text-center min-w-[250px]">
                 <p className="text-gray-400 text-sm mb-2">SCORE</p>
                 <p className="text-3xl text-white mb-4">{score}</p>
                 <div className="w-full h-px bg-gray-600 mb-4"></div>
                 <p className="text-gray-400 text-xs mb-1">HIGH SCORE</p>
                 <p className="text-xl text-yellow-400">{highScore}</p>
             </div>
             
             <button 
                onClick={() => setGameState(GameState.MENU)}
                className="bg-white text-black hover:bg-gray-200 font-bold py-3 px-8 rounded shadow-[0_4px_0_#999] active:shadow-none active:translate-y-1 transition-all flex items-center gap-2 font-['Press_Start_2P'] text-xs"
              >
                <RotateCcw size={16} /> MENU
              </button>
           </div>
        )}

        {/* Controls Hint */}
        {gameState === GameState.PLAYING && (
            <div className="absolute bottom-4 right-4 text-white/40 text-[10px] pointer-events-none font-sans bg-black/50 p-2 rounded">
                WASD / ARROWS to MOVE & JUMP
            </div>
        )}

      </div>
    </div>
  );
}

export default App;

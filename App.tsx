import React, { useState, useEffect } from 'react';
import { GameState, LevelConfig, ObstacleType } from './types';
import GameCanvas from './components/GameCanvas';
import { generateLevel } from './services/geminiService';
import { Loader2 } from 'lucide-react';
import { ASSETS } from './constants';
import { MainMenu } from './components/ui/MainMenu';
import { HUD } from './components/ui/HUD';
import { GameOver } from './components/ui/GameOver';
import { TouchControls } from './components/ui/TouchControls';
import { GameEngine } from './game/GameEngine';

const PRESET_LEVELS: LevelConfig[] = [
  {
    id: 'classic_1_1',
    name: "Classic 1-1",
    difficulty: "Easy",
    description: "The legendary beginning. Wide gaps and simple enemies.",
    theme: 'OVERWORLD',
    obstacles: [
       ObstacleType.QUESTION_BLOCK, ObstacleType.COIN, ObstacleType.BLOCK, ObstacleType.QUESTION_BLOCK, ObstacleType.BLOCK, ObstacleType.PIRANHA,
       ObstacleType.GOOMBA, ObstacleType.PIPE, ObstacleType.PIPE, ObstacleType.FIRE_FLOWER,
       ObstacleType.GAP, ObstacleType.BLOCK, ObstacleType.SHELL, ObstacleType.QUESTION_BLOCK, ObstacleType.GOOMBA,
       ObstacleType.PIRANHA, ObstacleType.COIN, ObstacleType.PIPE, ObstacleType.GOOMBA, ObstacleType.GAP,
       ObstacleType.BLOCK, ObstacleType.SHELL, ObstacleType.BLOCK, ObstacleType.GAP, ObstacleType.GOOMBA,
       ObstacleType.PIRANHA, ObstacleType.COIN, ObstacleType.FIRE_FLOWER, ObstacleType.BLOCK, ObstacleType.QUESTION_BLOCK
    ]
  },
  {
    id: 'dungeon_1_2',
    name: "Deep Dungeon",
    difficulty: "Medium",
    description: "Underground blues. Watch out for plants!",
    theme: 'UNDERGROUND',
    obstacles: [
        ObstacleType.BLOCK, ObstacleType.BLOCK, ObstacleType.BLOCK, ObstacleType.GAP, 
        ObstacleType.PIRANHA, ObstacleType.SHELL, ObstacleType.BLOCK, ObstacleType.FIRE_FLOWER,
        ObstacleType.GAP, ObstacleType.PIRANHA, ObstacleType.PIPE, ObstacleType.GOOMBA,
        ObstacleType.QUESTION_BLOCK, ObstacleType.COIN, ObstacleType.GAP, ObstacleType.BLOCK
    ]
  },
  {
    id: 'castle_1_4',
    name: "Bowser's Road",
    difficulty: "Hard",
    description: "Intense heat, fast speed, and tricky jumps.",
    theme: 'CASTLE',
    obstacles: [
        ObstacleType.GAP, ObstacleType.GAP, ObstacleType.BLOCK, ObstacleType.GAP,
        ObstacleType.PIRANHA, ObstacleType.SHELL, ObstacleType.SHELL, ObstacleType.GAP,
        ObstacleType.BLOCK, ObstacleType.FIRE_FLOWER, ObstacleType.GAP, ObstacleType.GAP,
        ObstacleType.PIRANHA, ObstacleType.COIN, ObstacleType.BLOCK, ObstacleType.GOOMBA
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
  const [announcement, setAnnouncement] = useState('');
  const [selectedColor, setSelectedColor] = useState<string>(ASSETS.CAR_BODY);
  const [engine, setEngine] = useState<GameEngine | null>(null);

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
        setAnnouncement("Level Generated Successfully");
    } catch (e) {
        console.error(e);
        setGameState(GameState.MENU);
        setAnnouncement("Level Generation Failed");
    } finally {
        setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-900 flex items-center justify-center p-2 md:p-4 overflow-hidden">
      <div className="sr-only" role="status" aria-live="polite">
        {announcement}
      </div>

      <div className="relative w-full max-w-4xl aspect-[4/3] bg-black rounded-xl overflow-hidden shadow-2xl border-2 md:border-4 border-gray-800 touch-none select-none">
        
        <GameCanvas 
          gameState={gameState} 
          setGameState={setGameState} 
          levelData={levelData}
          onScoreUpdate={setScore}
          onAnnounce={setAnnouncement}
          carColor={selectedColor}
          onEngineInit={setEngine}
        />

        {gameState === GameState.PLAYING && (
          <>
            <HUD score={score} levelName={levelData.name} />
            <TouchControls engine={engine} />
          </>
        )}

        {gameState === GameState.MENU && (
          <MainMenu 
            levelData={levelData}
            presetLevels={PRESET_LEVELS}
            selectedColor={selectedColor}
            prompt={prompt}
            isLoading={isLoading}
            onLevelSelect={handleLevelSelect}
            onColorSelect={setSelectedColor}
            onPromptChange={setPrompt}
            onGenerate={handleGenerateLevel}
            onStart={() => setGameState(GameState.PLAYING)}
          />
        )}

        {gameState === GameState.GENERATING && (
          <div className="absolute inset-0 bg-black/90 flex flex-col items-center justify-center text-white z-50">
             <Loader2 size={48} className="animate-spin text-purple-500 mb-4 md:w-16 md:h-16" />
             <p className="text-sm md:text-xl animate-pulse font-['Press_Start_2P'] text-center px-4 leading-relaxed">
                 CONSTRUCTING<br/>WORLD...
             </p>
          </div>
        )}

        {(gameState === GameState.GAME_OVER || gameState === GameState.VICTORY) && (
           <GameOver 
             score={score} 
             highScore={highScore} 
             onMenu={() => setGameState(GameState.MENU)}
             isVictory={gameState === GameState.VICTORY}
           />
        )}

        {gameState === GameState.PLAYING && (
            <div className="hidden md:block absolute bottom-4 right-4 text-white/40 text-[10px] pointer-events-none font-sans bg-black/50 p-2 rounded">
                W / UP to JUMP<br/>
                SPACE to SHOOT (Requires Flower)
            </div>
        )}

      </div>
    </div>
  );
}

export default App;

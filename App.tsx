import React, { useState, useEffect, Suspense, lazy } from 'react';
import { GameState, LevelConfig, ObstacleType } from './types';
// GameCanvas is heavy, lazy load it
const GameCanvas = lazy(() => import('./components/GameCanvas'));
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
      ObstacleType.QUESTION_BLOCK, ObstacleType.COIN, ObstacleType.BLOCK, ObstacleType.GAP,
      ObstacleType.GOOMBA, ObstacleType.PIPE, ObstacleType.PIPE, ObstacleType.COIN,
      ObstacleType.GAP, ObstacleType.BLOCK, ObstacleType.SHELL, ObstacleType.QUESTION_BLOCK,
      ObstacleType.GAP, ObstacleType.PIPE, ObstacleType.GOOMBA
    ]
  },
  {
    id: 'dungeon_1_2',
    name: "Deep Dungeon",
    difficulty: "Medium",
    description: "Underground blues. Watch out for piranhas!",
    theme: 'UNDERGROUND',
    obstacles: [
      ObstacleType.BLOCK, ObstacleType.PIRANHA, ObstacleType.BLOCK, ObstacleType.GAP,
      ObstacleType.PIPE, ObstacleType.SHELL, ObstacleType.BLOCK, ObstacleType.COIN,
      ObstacleType.GAP, ObstacleType.PIRANHA, ObstacleType.PIPE, ObstacleType.GOOMBA,
      ObstacleType.BLOCK, ObstacleType.COIN, ObstacleType.GAP, ObstacleType.SHELL
    ]
  },
  {
    id: 'castle_1_4',
    name: "Bowser's Road",
    difficulty: "Hard",
    description: "Intense heat, fast speed, and tricky jumps.",
    theme: 'CASTLE',
    obstacles: [
      ObstacleType.GAP, ObstacleType.BLOCK, ObstacleType.PIRANHA, ObstacleType.GAP,
      ObstacleType.SHELL, ObstacleType.SHELL, ObstacleType.GAP, ObstacleType.BLOCK,
      ObstacleType.FIRE_FLOWER, ObstacleType.GAP, ObstacleType.COIN, ObstacleType.PIRANHA,
      ObstacleType.SHELL, ObstacleType.GAP
    ]
  }
];

// Hidden templates for "AI" generation
const GENERATION_TEMPLATES: LevelConfig[] = [
  {
    id: 'tpl_speedway',
    name: "Speedway",
    difficulty: "Medium",
    description: "Fast track with lots of coins!",
    theme: 'OVERWORLD',
    obstacles: [
      ObstacleType.COIN, ObstacleType.COIN, ObstacleType.GAP, ObstacleType.COIN,
      ObstacleType.PIPE, ObstacleType.COIN, ObstacleType.SHELL, ObstacleType.COIN,
      ObstacleType.GAP, ObstacleType.COIN, ObstacleType.COIN, ObstacleType.QUESTION_BLOCK
    ]
  },
  {
    id: 'tpl_labyrinth',
    name: "Labyrinth",
    difficulty: "Hard",
    description: "Tricky blocks and pipes.",
    theme: 'UNDERGROUND',
    obstacles: [
      ObstacleType.BLOCK, ObstacleType.PIPE, ObstacleType.GAP, ObstacleType.BLOCK,
      ObstacleType.PIRANHA, ObstacleType.PIPE, ObstacleType.BLOCK, ObstacleType.GAP,
      ObstacleType.SHELL, ObstacleType.BLOCK, ObstacleType.PIPE, ObstacleType.COIN
    ]
  },
  {
    id: 'tpl_skyjump',
    name: "Sky Jump",
    difficulty: "Hard",
    description: "Don't look down!",
    theme: 'OVERWORLD',
    obstacles: [
      ObstacleType.GAP, ObstacleType.GAP, ObstacleType.COIN, ObstacleType.GAP,
      ObstacleType.SHELL, ObstacleType.GAP, ObstacleType.QUESTION_BLOCK, ObstacleType.GAP,
      ObstacleType.GAP, ObstacleType.PIRANHA, ObstacleType.GAP, ObstacleType.COIN
    ]
  },
  {
    id: 'tpl_volcano',
    name: "Volcano",
    difficulty: "Hard",
    description: "Hot hot hot!",
    theme: 'CASTLE',
    obstacles: [
      ObstacleType.FIRE_FLOWER, ObstacleType.GAP, ObstacleType.PIRANHA, ObstacleType.GAP,
      ObstacleType.SHELL, ObstacleType.BLOCK, ObstacleType.GAP, ObstacleType.FIRE_FLOWER,
      ObstacleType.PIRANHA, ObstacleType.GAP, ObstacleType.SHELL, ObstacleType.GAP
    ]
  },
  {
    id: 'tpl_ghost',
    name: "Ghost Valley",
    difficulty: "Medium",
    description: "Spooky obstacles await...",
    theme: 'UNDERGROUND',
    obstacles: [
      ObstacleType.GAP, ObstacleType.PIRANHA, ObstacleType.GAP, ObstacleType.SHELL,
      ObstacleType.BLOCK, ObstacleType.GAP, ObstacleType.PIRANHA, ObstacleType.BLOCK,
      ObstacleType.GAP, ObstacleType.SHELL, ObstacleType.GAP, ObstacleType.PIRANHA
    ]
  }
];

// Memoized Loading Screen
const LoadingScreen = React.memo(() => (
  <div className="absolute inset-0 bg-black/90 flex flex-col items-center justify-center text-white z-50">
    <Loader2 size={48} className="animate-spin text-purple-500 mb-4 md:w-16 md:h-16" />
    <p className="text-sm md:text-xl animate-pulse font-['Press_Start_2P'] text-center px-4 leading-relaxed">
      CONSTRUCTING<br />WORLD...
    </p>
  </div>
));

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

    // Simulate generation delay for effect
    setTimeout(() => {
      try {
        // Randomly select one of the 5 templates
        const template = GENERATION_TEMPLATES[Math.floor(Math.random() * GENERATION_TEMPLATES.length)];

        // Create new level based on template but with user's name
        const newLevel: LevelConfig = {
          ...template,
          id: `gen_${Date.now()}`,
          name: prompt.toUpperCase(),
          description: `Custom generated level: ${prompt}`,
          isCustom: true
        };

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
    }, 1500);
  };

  return (
    <div className="fixed inset-0 bg-black overflow-hidden group">
      <div className="sr-only" role="status" aria-live="polite">
        {announcement}
      </div>

      <div className="absolute inset-0 w-full h-full bg-sky-300 overflow-hidden touch-none select-none">
        {/* Dynamic Sky Background for Game */}
        <div className="absolute inset-0 pointer-events-none opacity-50 bg-[linear-gradient(to_bottom,#87CEEB_0%,#E0F6FF_100%)]" />

        {/* Mario Hills Background Pattern (CSS Generator mimic) */}
        <div className="absolute bottom-0 left-0 right-0 h-64 opacity-60 pointer-events-none bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAxNDQwIDMyMCI+PHBhdGggZmlsbD0iIzAwYjE0MCIgZmlsbC1vcGFjaXR5PSIxIiBkPSJNMCAyMjRMMzAgMjEzLjNDNjAgMjAzIDEyMCAxODEgMTgwIDE5MkMyNDAgMjAzIDMwMCAyNDUgMzYwIDI2MS4zQzQyMCAyNzcgNDgwIDI2NyA1NDAgMjM0LjdDNjAwIDIwMyA2NjAgMTQ5IDcyMCAxNDkuM0M3ODAgMTQ5IDg0MCAyMDMgOTAwIDIyOS4zQOTYwIDI1NiAxMDIwIDI1NiAxMDgwIDIyOS4zQzExNDAgMjAzIDEyMDAgMTQ5IDEyNjAgMTI4QzEzMjAgMTA3IDEzODAgMTE3IDE0MTAgMTIyLjdMMTQ0MCAxMjhMMTQ0MCAzMjBMMTQxMCAzMjBDMTM4MCAzMjAgMTMyMCAzMjAgMTI2MCAzMjBDMTIwMCAzMjAgMTE0MCAzMjAgMTA4MCAzMjBDMTAyMCAzMjAgOTYwIDMyMCA5MDAgMzIwQzg0MCAzMjAgNzgwIDMyMCA3MjAgMzIwQzY2MCAzMjAgNjAwIDMyMCA1NDAgMzIwQzQ4MCAzMjAgNDIwIDMyMCAzNjAgMzIwQzMwMCAzMjAgMjQwIDMyMCAxODAgMzIwQzEyMCAzMjAgNjAgMzIwIDMwIDMyMEwwIDMyMFoiPjwvcGF0aD48L3N2Zz4=')] bg-repeat-x bg-bottom bg-contain" />

        <Suspense fallback={<LoadingScreen />}>
          <GameCanvas
            gameState={gameState}
            setGameState={setGameState}
            levelData={levelData}
            onScoreUpdate={setScore}
            onAnnounce={setAnnouncement}
            carColor={selectedColor}
            onEngineInit={setEngine}
          />
        </Suspense>

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

        {gameState === GameState.GENERATING && <LoadingScreen />}

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
            W / UP to JUMP<br />
            SPACE to SHOOT (Requires Flower)
          </div>
        )}

      </div>
    </div>
  );
}

export default App;

import React, { useEffect, useRef, useState } from 'react';
import { GameState, LevelConfig } from '../types';
import { GameEngine } from '../game/GameEngine';
import { CANVAS_WIDTH, CANVAS_HEIGHT } from '../constants';

interface GameCanvasProps {
  gameState: GameState;
  setGameState: (state: GameState) => void;
  levelData: LevelConfig | null;
  onScoreUpdate: (score: number) => void;
  onAnnounce: (message: string) => void;
  carColor: string;
  onEngineInit?: (engine: GameEngine) => void;
}

const GameCanvas: React.FC<GameCanvasProps> = ({
  gameState,
  setGameState,
  levelData,
  onScoreUpdate,
  onAnnounce,
  carColor,
  onEngineInit
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const engineRef = useRef<GameEngine | null>(null);
  const [description, setDescription] = useState("Game Stopped. Press Start to play.");

  // Initialize Engine
  useEffect(() => {
    if (!canvasRef.current) return;

    // Instantiate game engine with callbacks
    engineRef.current = new GameEngine(
      canvasRef.current,
      (newState) => {
        setGameState(newState);
        if (newState === GameState.PLAYING) setDescription("Game Running. Press Arrow Keys to move, Space to shoot.");
        else if (newState === GameState.GAME_OVER) setDescription("Game Over.");
        else if (newState === GameState.VICTORY) setDescription("Victory! Level Complete.");
      },
      onScoreUpdate,
      onAnnounce
    );

    if (onEngineInit) {
      onEngineInit(engineRef.current);
    }

    return () => {
      engineRef.current?.cleanup();
    };
  }, []); // Run once on mount

  // Sync Level Data
  useEffect(() => {
    if (engineRef.current && levelData) {
      engineRef.current.setLevel(levelData);
      setDescription(`Level loaded: ${levelData.name}. Difficulty: ${levelData.difficulty}.`);
    }
  }, [levelData]);

  // Sync Car Color
  useEffect(() => {
    if (engineRef.current) {
      engineRef.current.setCarColor(carColor);
    }
  }, [carColor]);

  // Sync Game State (Start/Stop)
  useEffect(() => {
    if (!engineRef.current) return;

    if (gameState === GameState.PLAYING && engineRef.current.gameState !== GameState.PLAYING) {
      engineRef.current.start();
      canvasRef.current?.focus();
    } else if (gameState === GameState.MENU) {
      engineRef.current.stop();
    }
  }, [gameState]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    // Prevent scrolling with keys
    if (['Space', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.code)) {
      e.preventDefault();
    }
  };

  return (
    <div className="relative w-full h-full">
      <canvas
        ref={canvasRef}
        width={CANVAS_WIDTH}
        height={CANVAS_HEIGHT}
        className="w-full h-full object-contain bg-sky-300 outline-none select-none touch-none focus:ring-4 focus:ring-blue-500 rounded-lg"
        tabIndex={0}
        onKeyDown={handleKeyDown}
        aria-label="Game Screen"
        aria-describedby="game-description"
        role="application"
      />
      <div id="game-description" className="sr-only" aria-live="polite">
        {description}
      </div>
    </div>
  );
};

export default GameCanvas;

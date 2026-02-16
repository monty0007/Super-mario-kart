import React, { useEffect, useRef } from 'react';
import { GameState, LevelConfig } from '../types';
import { GameEngine } from '../game/GameEngine';
import { CANVAS_WIDTH, CANVAS_HEIGHT } from '../constants';

interface GameCanvasProps {
  gameState: GameState;
  setGameState: (state: GameState) => void;
  levelData: LevelConfig | null;
  onScoreUpdate: (score: number) => void;
  onAnnounce: (message: string) => void;
}

const GameCanvas: React.FC<GameCanvasProps> = ({ 
  gameState, 
  setGameState, 
  levelData, 
  onScoreUpdate,
  onAnnounce
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const engineRef = useRef<GameEngine | null>(null);

  // Initialize Engine
  useEffect(() => {
    if (!canvasRef.current) return;

    // Instantiate game engine with callbacks
    engineRef.current = new GameEngine(
      canvasRef.current,
      (newState) => setGameState(newState),
      onScoreUpdate,
      onAnnounce
    );

    return () => {
      engineRef.current?.cleanup();
    };
  }, []); // Run once on mount

  // Sync Level Data
  useEffect(() => {
    if (engineRef.current && levelData) {
      engineRef.current.setLevel(levelData);
    }
  }, [levelData]);

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

  return (
    <canvas 
      ref={canvasRef} 
      width={CANVAS_WIDTH} 
      height={CANVAS_HEIGHT} 
      className="w-full h-full object-contain bg-sky-300 outline-none"
      tabIndex={0}
      aria-label="Game Screen. Press W to jump, Space to shoot."
    />
  );
};

export default GameCanvas;

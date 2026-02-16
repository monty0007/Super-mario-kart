import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { GameEngine } from './GameEngine';
import { GameState } from '../types';

// Mock Dependencies
vi.mock('./InputManager', () => {
    return {
        InputManager: vi.fn().mockImplementation(function () {
            return {
                isActionActive: vi.fn(() => false),
                cleanup: vi.fn()
            };
        })
    }
});

vi.mock('./Renderer', () => {
    return {
        GameRenderer: vi.fn().mockImplementation(function () {
            return {
                draw: vi.fn()
            };
        })
    }
});

// Mock Canvas and Context
const mockContext = {
    getContextAttributes: vi.fn(),
} as unknown as CanvasRenderingContext2D;

const mockCanvas = {
    getContext: vi.fn(() => mockContext),
    width: 800,
    height: 600,
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    getBoundingClientRect: vi.fn(() => ({ left: 0, top: 0, width: 800, height: 600 })),
} as unknown as HTMLCanvasElement;

describe('GameEngine', () => {
    let engine: GameEngine;
    const onStateChange = vi.fn();
    const onScoreUpdate = vi.fn();
    const onAnnounce = vi.fn();

    beforeEach(() => {
        vi.useFakeTimers();
        vi.clearAllMocks();

        vi.stubGlobal('requestAnimationFrame', (cb: FrameRequestCallback) => {
            return setTimeout(cb, 16);
        });
        vi.stubGlobal('cancelAnimationFrame', (id: number) => {
            clearTimeout(id);
        });

        engine = new GameEngine(mockCanvas, onStateChange, onScoreUpdate, onAnnounce);
    });

    afterEach(() => {
        engine?.cleanup();
        vi.unstubAllGlobals();
        vi.useRealTimers();
    });

    it('should initialize with MENU state', () => {
        expect(engine.gameState).toBe(GameState.MENU);
    });

    it('should start the game', () => {
        engine.start();
        expect(engine.gameState).toBe(GameState.PLAYING);
        expect(onStateChange).toHaveBeenCalledWith(GameState.PLAYING);
        expect(onAnnounce).toHaveBeenCalledWith(expect.stringContaining("Game Started"));

        vi.advanceTimersByTime(50);
        engine.stop();
    });

    it('should stop the game', () => {
        engine.start();
        engine.stop();
        expect(engine.gameState).toBe(GameState.MENU);
    });

    it('should reset score on start', () => {
        engine.start();
        expect(onScoreUpdate).toHaveBeenCalledWith(0);
        engine.stop();
    });

    it('should handle level setting', () => {
        const level = {
            id: 'test',
            name: 'Test Level',
            difficulty: 'Easy',
            description: 'Test',
            theme: 'OVERWORLD' as const,
            obstacles: []
        };
        engine.setLevel(level);
        expect((engine as any).levelData).toBe(level);
    });
});

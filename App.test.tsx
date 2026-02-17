import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import App from './App';
import React from 'react';

// Mock GameCanvas since it uses Canvas API
vi.mock('./components/GameCanvas', () => {
    return {
        default: () => <div data-testid="game-canvas">Game Canvas</div>
    };
});

// Mock Gemini Service
vi.mock('./services/geminiService', () => {
    return {
        generateLevel: vi.fn().mockResolvedValue({
            id: 'gen_123',
            name: 'Generated Level',
            difficulty: 'Hard',
            description: 'AI Generated',
            theme: 'CASTLE',
            obstacles: []
        })
    };
});

describe('App Integration', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('renders main menu by default', async () => {
        render(<App />);
        expect(screen.getByText(/SUPER KART/i)).toBeInTheDocument();
        expect(screen.getByText(/Select Track/i)).toBeInTheDocument();
        expect(screen.getByRole('button', { name: /Start Race/i })).toBeInTheDocument();
    });

    it('starts game when Race button is clicked', async () => {
        render(<App />);
        const raceBtn = screen.getByRole('button', { name: /Start Race/i });
        fireEvent.click(raceBtn);

        await waitFor(() => {
            expect(screen.getByTestId('game-canvas')).toBeInTheDocument();
        });
    });

    it('handles AI level generation flow', async () => {
        render(<App />);
        const input = screen.getByLabelText(/AI Prompt Input/i);
        const genBtn = screen.getByRole('button', { name: /Generate Level/i });

        fireEvent.change(input, { target: { value: 'Spooky castle' } });
        expect(input).toHaveValue('Spooky castle');
        expect(genBtn).not.toBeDisabled();

        fireEvent.click(genBtn);

        // Should show loading state
        expect(screen.getByText(/CONSTRUCTING/i)).toBeInTheDocument();

        // Should eventually return to menu with generated level
        await waitFor(() => {
            expect(screen.queryByText(/CONSTRUCTING/i)).not.toBeInTheDocument();
            expect(screen.getByText(/Generated Level/i)).toBeInTheDocument();
        });
    });
});

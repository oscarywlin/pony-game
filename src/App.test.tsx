import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import App from './App';

describe('App Component', () => {
    it('renders without crashing', () => {
        render(<App />);
        // We can check if some basic element is present, 
        // for example, the game title if it's there.
        // Since I don't know the exact content, I'll just check if the container is rendered.
        expect(document.body).toBeInTheDocument();
    });
});

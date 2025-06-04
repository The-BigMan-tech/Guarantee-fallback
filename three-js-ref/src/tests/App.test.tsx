import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import App from '../App';

describe('App', () => {
  // Test initial render
  it('renders initial content correctly', () => {
    render(<App />);
    
    // Check logos
    expect(screen.getByAltText('Vite logo')).toBeInTheDocument();
    expect(screen.getByAltText('React logo')).toBeInTheDocument();
    
    // Check headings
    expect(screen.getByRole('heading', { name: /vite \+ react/i })).toBeInTheDocument();
    expect(screen.getByText(/edit src\/app.tsx and save to test hmr/i)).toBeInTheDocument();
    
    // Verify initial button state
    expect(screen.getByRole('button', { name: /count is 0/i })).toBeInTheDocument()
  });

  // Test counter interaction
  it('increments count when button is clicked', async () => {
    render(<App />);
    const user = userEvent.setup();
    const button = screen.getByRole('button', { name: /count is 0/i });
    await user.click(button);
    
    expect(button).toHaveTextContent('count is 1');
  });
});

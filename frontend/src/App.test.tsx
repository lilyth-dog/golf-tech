import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import App from './App';

// Avoid loading heavy pages in unit tests
vi.mock('./pages/VideoAnalyzer3D', () => ({ default: () => <div>ANALYZE_PAGE</div> }));
vi.mock('./pages/ProfilePage', () => ({ default: () => <div>PROFILE_PAGE</div> }));
vi.mock('./pages/SwingAnalysis', () => ({ default: () => <div>SWING_PAGE</div> }));

describe('App routing', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('redirects to login when unauthenticated', async () => {
    render(
      <MemoryRouter initialEntries={['/']}>
        <App />
      </MemoryRouter>
    );
    expect(await screen.findByText('Welcome Back')).toBeInTheDocument();
  });

  it('shows Home links when authenticated', async () => {
    localStorage.setItem('token', 't');
    const user = userEvent.setup();
    render(
      <MemoryRouter initialEntries={['/']}>
        <App />
      </MemoryRouter>
    );

    expect(await screen.findByText('Welcome to Golf Tech')).toBeInTheDocument();
    await user.click(screen.getByRole('link', { name: /My Profile/i }));
    expect(await screen.findByText('PROFILE_PAGE')).toBeInTheDocument();
  });
});


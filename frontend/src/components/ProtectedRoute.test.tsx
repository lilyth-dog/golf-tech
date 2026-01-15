import { describe, it, expect, beforeEach } from 'vitest';
import { Routes, Route } from 'react-router-dom';
import ProtectedRoute from './ProtectedRoute';
import { renderWithRouter } from '../test/testUtils';

function AppUnderTest() {
  return (
    <Routes>
      <Route path="/login" element={<div>LOGIN</div>} />
      <Route
        path="/"
        element={
          <ProtectedRoute>
            <div>HOME</div>
          </ProtectedRoute>
        }
      />
    </Routes>
  );
}

describe('ProtectedRoute', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('redirects to /login when no token', async () => {
    const { findByText } = renderWithRouter(<AppUnderTest />, { route: '/' });
    expect(await findByText('LOGIN')).toBeInTheDocument();
  });

  it('renders children when token exists', async () => {
    localStorage.setItem('token', 't');
    const { findByText } = renderWithRouter(<AppUnderTest />, { route: '/' });
    expect(await findByText('HOME')).toBeInTheDocument();
  });
});


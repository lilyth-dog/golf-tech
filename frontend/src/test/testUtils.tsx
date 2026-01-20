import React from 'react';
import { MemoryRouter } from 'react-router-dom';
import { render, type RenderOptions } from '@testing-library/react';

export function renderWithRouter(
  ui: React.ReactElement,
  { route = '/', ...options }: RenderOptions & { route?: string } = {}
) {
  return render(<MemoryRouter initialEntries={[route]}>{ui}</MemoryRouter>, options);
}


import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import App from '../App.js';

describe('App', () => {
  it('renderiza correctamente', () => {
    render(
      <MemoryRouter>
        <App />
      </MemoryRouter>
    );
    expect(screen.getByText('PC2-PFDC3')).toBeInTheDocument();
  });
});

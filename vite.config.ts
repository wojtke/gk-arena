/// <reference types="vitest/config" />
import { defineConfig } from 'vite';

// base: './' keeps asset paths relative for GitHub Pages deploys under a subpath.
export default defineConfig({
  base: './',
  test: {
    // Tests live next to the code they cover (src/games/<game>/tests, src/shell).
    include: ['src/**/*.test.ts'],
    environment: 'node',
  },
});

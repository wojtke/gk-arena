/// <reference types="vitest/config" />
import { defineConfig, type Plugin } from 'vite';

// Emit a 404.html that is a byte-for-byte copy of index.html. GitHub Pages serves 404.html for any
// path that doesn't map to a file, so a hard refresh / shared link to a deep path (e.g.
// /gk-arena/arc-match) re-bootstraps the SPA, and the History-API router then reads the path.
function spaFallback(): Plugin {
  return {
    name: 'spa-404-fallback',
    enforce: 'post', // run after Vite's html plugin so index.html is already in the bundle
    generateBundle(_options, bundle) {
      const index = bundle['index.html'];
      if (index && index.type === 'asset') {
        this.emitFile({ type: 'asset', fileName: '404.html', source: index.source });
      }
    },
  };
}

// `base` must match the GitHub Pages subpath (the repo name) so absolute asset URLs resolve on deep
// paths too. Change it if the repo is renamed or served elsewhere.
export default defineConfig({
  base: '/gk-arena/',
  plugins: [spaFallback()],
  test: {
    // Tests live next to the code they cover (src/games/<game>/tests, src/shell).
    include: ['src/**/*.test.ts'],
    environment: 'node',
  },
});

import { defineConfig } from 'vite';

// Foundry loads dist/main.js as an ES module (see module.json "esmodules").
// Styles stay as plain CSS in styles/ so Foundry's hot reload can pick them up.
export default defineConfig({
  build: {
    outDir: 'dist',
    emptyOutDir: true,
    sourcemap: true,
    minify: false,
    lib: {
      entry: 'src/main.ts',
      formats: ['es'],
      fileName: () => 'main.js',
    },
  },
});

import { defineConfig } from 'tsup';

export default defineConfig({
  entry: ['src/index.ts'],
  format: ['cjs', 'esm'],
  dts: true,

  clean: true,
  shims: true,
  cjsInterop: true,
  minify: false,
  keepNames: true,
});

import { defineConfig } from 'tsup';

export default defineConfig({
    entry: { index: 'src/server.ts' },
    format: ['esm'],
    target: 'node20',
    outDir: 'api',
    clean: true,
    sourcemap: false,
    bundle: true,
    splitting: false,
    outExtension: () => ({ js: '.js' }),
    // Externalize native modules to prevent bundling issues
    external: ['argon2', 'sharp'],
});

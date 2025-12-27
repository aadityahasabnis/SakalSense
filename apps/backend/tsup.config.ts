import { defineConfig } from 'tsup';

export default defineConfig({
    entry: { index: 'src/server.ts' }, // Vercel serverless entry
    format: ['esm'],
    target: 'node20',
    outDir: 'api',
    clean: true,
    sourcemap: false,
    bundle: true,
    splitting: false,
    outExtension: () => ({ js: '.js' }),
    noExternal: [/.*/], // Bundle all dependencies
});

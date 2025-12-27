import { defineConfig } from 'tsup';

export default defineConfig({
    entry: { index: 'src/server.ts' }, // Vercel serverless entry
    format: ['cjs'],
    target: 'node20',
    outDir: 'api',
    clean: true,
    sourcemap: false,
    bundle: true,
    splitting: false,
    outExtension: () => ({ js: '.js' }), // Force .js extension
    // Bundle ALL dependencies - Vercel won't run npm install
    noExternal: [/.*/], // Add footer to ensure module.exports = default export
    footer: { js: 'module.exports = module.exports.default || module.exports;' },
});

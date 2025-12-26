import { defineConfig } from 'tsup';

export default defineConfig({
    entry: ['src/index.ts'],
    format: ['esm'],
    target: 'node20',
    outDir: 'dist',
    clean: true,
    sourcemap: true,
    dts: false,
    splitting: false,
    bundle: true,
    external: ['express', 'mongoose', 'redis', 'argon2', 'helmet', 'compression', 'cors', 'cookie-parser', 'jsonwebtoken'],
    noExternal: ['@sakalsense/core'],
});

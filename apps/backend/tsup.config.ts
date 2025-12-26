import { defineConfig } from 'tsup';

export default defineConfig({
    entry: ['src/server.ts'],
    format: ['esm'],
    target: 'node20',
    outDir: 'dist',
    clean: true,
    sourcemap: false,
    bundle: true,
    splitting: false,
    noExternal: ['@sakalsense/core', 'express', 'mongoose', 'redis', 'argon2', 'helmet', 'compression', 'cors', 'cookie-parser', 'jsonwebtoken'],
});

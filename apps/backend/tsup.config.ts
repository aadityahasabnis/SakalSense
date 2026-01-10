import { defineConfig } from 'tsup';

export default defineConfig({
    entry: { 
        'api/index': 'api/handler.ts'
    },
    format: ['esm'],
    target: 'node20',
    outDir: 'dist',
    clean: true,
    sourcemap: false,
    bundle: true,
    splitting: false,
    outExtension: () => ({ js: '.js' }),
    // Bundle everything except native modules
    noExternal: [/.*/],
    external: ['argon2', 'sharp'],
    onSuccess: async () => {
        const fs = await import('fs');
        const path = await import('path');
        const srcFile = path.join(process.cwd(), 'dist/api/index.js');
        const destFile = path.join(process.cwd(), 'api/index.js');
        fs.copyFileSync(srcFile, destFile);
        console.log('✓ Copied dist/api/index.js to api/index.js');
        
        // Delete handler.ts so Vercel only sees index.js
        const handlerFile = path.join(process.cwd(), 'api/handler.ts');
        if (fs.existsSync(handlerFile)) {
            fs.unlinkSync(handlerFile);
            console.log('✓ Deleted api/handler.ts - only bundled index.js remains');
        }
    },
});

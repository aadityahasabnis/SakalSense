import { defineConfig } from 'tsup';

export default defineConfig({
    entry: { 
        'api/index': 'vercel-handler.ts'
    },
    format: ['cjs'], // CommonJS format - fixes "Dynamic require not supported" error
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
        
        // Copy bundle to api directory
        const srcFile = path.join(process.cwd(), 'dist/api/index.js');
        const destFile = path.join(process.cwd(), 'api/index.js');
        fs.copyFileSync(srcFile, destFile);
        console.log('✓ Copied dist/api/index.js to api/index.js');
        
        // Create .vercel/output directory structure for Build Output API
        const outputDir = path.join(process.cwd(), '.vercel/output');
        const functionsDir = path.join(outputDir, 'functions/api.func');
        
        // Create directories
        fs.mkdirSync(functionsDir, { recursive: true });
        
        // Copy bundle to functions directory
        fs.copyFileSync(srcFile, path.join(functionsDir, 'index.js'));
        
        // Copy api/package.json to override type: module
        const apiPkgJson = path.join(process.cwd(), 'api/package.json');
        if (fs.existsSync(apiPkgJson)) {
            fs.copyFileSync(apiPkgJson, path.join(functionsDir, 'package.json'));
        }
        
        // Create .vc-config.json for the function
        const vcConfig = {
            runtime: 'nodejs20.x',
            handler: 'index.js',
            launcherType: 'Nodejs',
            shouldAddHelpers: false
        };
        fs.writeFileSync(
            path.join(functionsDir, '.vc-config.json'),
            JSON.stringify(vcConfig, null, 2)
        );
        
        // Create config.json for output directory
        const outputConfig = { version: 3 };
        fs.writeFileSync(
            path.join(outputDir, 'config.json'),
            JSON.stringify(outputConfig, null, 2)
        );
        
        console.log('✓ Created Vercel Build Output API structure');
    },
});

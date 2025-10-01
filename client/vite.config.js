import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default ({ mode }) => {
  process.env = {...process.env, ...loadEnv(mode, process.cwd())};
  
  return defineConfig({
    // Base URL pour la production (décommenter pour le build)
    // base: `${process.env.VITE_BASE_URL === '/' ? '' : process.env.VITE_BASE_URL}`,
    
    plugins: [react()],
    
    build: {
      outDir: './../webpub'
    },
    
    // Configuration des tests avec Vitest
    test: {
      globals: true,
      environment: 'jsdom',
      setupFiles: './src/test/setup.js',
      coverage: {
        provider: 'v8',
        reporter: ['text', 'json', 'html'],
        exclude: [
          'node_modules/',
          'src/test/',
          '**/*.test.jsx',
          '**/*.test.js',
          'vite.config.js'
        ]
      }
    }
  })
}
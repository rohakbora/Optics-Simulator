import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react({
      babel: {
        plugins: [['babel-plugin-react-compiler']],
      },
    }),
  ],
  assetsInclude: ['**/*.svg'],
  build: {
    outDir: 'dist', // <-- ensures correct output folder for Vercel
  },
  base: './', // <-- prevents 404s on refresh or subroutes
})

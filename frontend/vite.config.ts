import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      // Fix ethers.js browser build
      'stream': 'stream-browserify',
    },
  },
  define: {
    global: 'globalThis',
  },
  optimizeDeps: {
    include: ['ethers'],
  },
})

import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  base: '/',
  server: {
    hmr: {
      overlay: false, 
    },
  },
  plugins: [react() ],
})

import { defineConfig } from 'vite'
import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  server: {
    hmr: {
      overlay: false, // Disable the overlay that throws WebSocket errors
    },
  },
  plugins: [react(),
    tailwindcss()
  ],
})

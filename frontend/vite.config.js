import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  build: {
    // xlsx is large but only used on the admin page — suppress the warning
    chunkSizeWarningLimit: 1500,
  },
})


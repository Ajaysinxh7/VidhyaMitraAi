import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom', 'react-router-dom'],
          charts: ['recharts'],
          animation: ['framer-motion'],
          supabase: ['@supabase/supabase-js'],
          ui: ['@mui/material', '@mui/icons-material', 'lucide-react']
        }
      }
    }
  },
  server: {
    watch: {
      ignored: ['**/backend/**']
    }
  }
})

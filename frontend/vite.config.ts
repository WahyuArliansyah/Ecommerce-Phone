import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { defineConfig } from 'vite'

export default defineConfig({
  // menambahkan tailwindcss agar bisa digunakan
  plugins: [react(), tailwindcss()], 
  server: { port: 5173 },
})
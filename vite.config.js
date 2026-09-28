import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react-swc'
import { fileURLToPath, URL } from 'node:url'

export default defineConfig({
  plugins: [react()],
  resolve: {
    // shadcn/ui komponentləri "@/..." importları ilə gəlir (Node 18 CI ilə uyğun yazılış)
    alias: { '@': fileURLToPath(new URL('./src', import.meta.url)) },
  },
  server: {
    port: 3000,
    host: '0.0.0.0',
    // Dev rejimində API lokal backend-dir (http://localhost:5276) — bax src/services/api.js
  }
})

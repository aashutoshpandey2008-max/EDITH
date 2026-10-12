import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// base './' lets the production build (dist/) also work when served by Live Server or any static host.
export default defineConfig({ base: './', plugins: [react()], server: { port: 5173, open: true } })

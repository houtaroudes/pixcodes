import path from 'node:path'
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: { '@': path.resolve(import.meta.dirname, './src') },
  },
  // Local port band, so these projects can run beside each other. Each one owns
  // a slot and sets strictPort, so an occupied port fails loudly instead of
  // moving: kalendaryo 5200, voltcart 5300, pixcodes 5310, starter-kit 5320,
  // st-joseph-village 5330, houtaroudes-portfolio-v1 5340,
  // houtaroudes-portfolio 5350, houtaroudes-flipbook-portfolio 5360,
  // the PixelPodWeb booth 5400.
  server: { port: 5310, strictPort: true },
})

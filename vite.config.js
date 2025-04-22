import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate', // Automatically update the service worker
      includeAssets: ['favicon.ico', 'apple-touch-icon.png', '4.png'], // Include static assets
      manifest: {
        name: 'Aarthika Finance',
        short_name: 'Aarthika',
        description: 'Aarthika - Empowering Rural Finance with Trust and Technology.',
        theme_color: '#242E4C', // Dark blue theme color from site
        background_color: '#ffffff', // Standard white background
        start_url: '/',
        display: 'standalone', // Opens as a standalone app
        icons: [
          {
            src: '4.png', // Assuming 4.png is in the public folder
            sizes: '192x192',
            type: 'image/png',
            purpose: 'any' // Can be used for any purpose (general icon)
          },
          {
            src: '4.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'any'
          },
           {
            src: '4.png', // Maskable icon source (can be the same)
            sizes: '192x192',
            type: 'image/png',
            purpose: 'maskable' // Important for Android adaptive icons
          },
          {
            src: '4.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'maskable'
          }
        ]
      },
      // Service worker configuration (optional, default is generateSW)
      workbox: {
         globPatterns: ['**/*.{js,css,html,png,jpg,svg,woff,woff2}'], // Cache common assets
         runtimeCaching: [ // Example: Cache API calls if needed (adjust pattern)
          // {
          //   urlPattern: /^https:\/\/api\.yourapp\.com\/.*/i,
          //   handler: 'NetworkFirst',
          //   options: {
          //     cacheName: 'api-cache',
          //     expiration: {
          //       maxEntries: 10,
          //       maxAgeSeconds: 60 * 60 * 24 // 1 day
          //     },
          //     cacheableResponse: {
          //       statuses: [0, 200]
          //     }
          //   }
          // }
        ]
      },
      devOptions: {
        enabled: true // Enable PWA features in development mode for testing
      }
    })
  ],
  server: {
    port: 3000,
    open: true
  }
})

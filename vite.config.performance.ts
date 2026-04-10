import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { resolve } from 'path'

// Performance optimized Vite configuration
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': resolve(__dirname, 'src'),
    },
  },
  build: {
    // Enable source maps for debugging
    sourcemap: true,
    
    // Optimize bundle size
    rollupOptions: {
      output: {
        manualChunks: {
          // Separate vendor chunks
          vendor: ['react', 'react-dom'],
          mui: ['@mui/material', '@mui/icons-material'],
          ethers: ['ethers'],
          crypto: ['crypto-js', 'bip39'],
          utils: ['react-router-dom', 'qrcode']
        }
      }
    },
    
    // Optimize chunk size
    chunkSizeWarningLimit: 1000,
    
    // Target modern browsers for better performance
    target: 'esnext',
    
    // Minify for production
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: true,
        drop_debugger: true,
      },
    },
  },
  
  // Optimize development server
  server: {
    hmr: {
      overlay: false,
    },
    // Enable gzip compression
    middlewareMode: false,
  },
  
  // Optimize dependencies
  optimizeDeps: {
    include: [
      'react',
      'react-dom',
      '@mui/material',
      '@mui/icons-material',
      'ethers',
      'crypto-js',
      'bip39',
      'qrcode',
      'react-router-dom'
    ],
    exclude: [
      // Exclude electron-related modules from optimization
      'electron'
    ],
  },
  
  // Enable experimental features for better performance
  esbuild: {
    // Remove console.log in production
    drop: ['console', 'debugger'],
    // Enable tree shaking
    treeShaking: true,
  },
  
  // CSS optimization
  css: {
    // Enable CSS code splitting
    codeSplit: true,
    // Minimize CSS
    postcss: {
      plugins: [
        // Add any PostCSS plugins here
      ],
    },
  },
})
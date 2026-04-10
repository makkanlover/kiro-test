import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { resolve } from 'path'
import { loadEnv } from 'vite'

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  
  return {
    plugins: [react()],
    define: {
      'import.meta.env.VITE_PRIVATE_KEY': JSON.stringify(env.PRIVATE_KEY),
      'import.meta.env.VITE_SEPOLIA_RPC_URL': JSON.stringify(env.VITE_SEPOLIA_RPC_URL),
      'import.meta.env.VITE_AMOY_RPC_URL': JSON.stringify(env.VITE_AMOY_RPC_URL),
      'import.meta.env.VITE_SEPOLIA_RPC_URL_FALLBACK': JSON.stringify(env.VITE_SEPOLIA_RPC_URL_FALLBACK),
      'import.meta.env.VITE_AMOY_RPC_URL_FALLBACK': JSON.stringify(env.VITE_AMOY_RPC_URL_FALLBACK),
      'import.meta.env.VITE_ETHERSCAN_API_KEY': JSON.stringify(env.VITE_ETHERSCAN_API_KEY),
      'import.meta.env.VITE_POLYGONSCAN_API_KEY': JSON.stringify(env.VITE_POLYGONSCAN_API_KEY)
    },
  resolve: {
    alias: {
      '@': resolve(__dirname, './src'),
      '@/components': resolve(__dirname, './src/components'),
      '@/hooks': resolve(__dirname, './src/hooks'),
      '@/utils': resolve(__dirname, './src/utils'),
      '@/types': resolve(__dirname, './src/types')
    }
  },
  build: {
    outDir: 'dist-renderer',
    rollupOptions: {
      input: {
        main: resolve(__dirname, 'index.html')
      }
    }
  },
    server: {
      port: 3000,
      host: '127.0.0.1'
    }
  }
})
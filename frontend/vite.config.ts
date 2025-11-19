import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  
  return {
    plugins: [react()],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, './src'),
      },
    },
    server: {
      port: 5174,
      host: true,
      proxy: {
        '/api': {
          target: env.VITE_API_URL || 'http://localhost:3000',
          changeOrigin: true,
        }
      }
    },
    build: {
      outDir: 'dist',
      sourcemap: false,
      minify: 'esbuild',
      target: 'es2015',
      cssTarget: 'chrome80',
      rollupOptions: {
        output: {
          manualChunks: (id) => {
            if (id.includes('node_modules')) {
              if (id.includes('react') || id.includes('react-dom') || id.includes('react-router')) {
                return 'react-vendor';
              }
              if (id.includes('antd')) {
                return 'antd-vendor';
              }
              if (id.includes('echarts')) {
                return 'chart-vendor';
              }
              if (id.includes('@apollo/client') || id.includes('graphql')) {
                return 'apollo-vendor';
              }
              return 'vendor';
            }
          },
          chunkFileNames: 'js/[name]-[hash].js',
          entryFileNames: 'js/[name]-[hash].js',
          assetFileNames: '[ext]/[name]-[hash].[ext]',
        },
      },
      chunkSizeWarningLimit: 1000,
      commonjsOptions: {
        transformMixedEsModules: true,
      },
    },
    define: {
      'process.env': {},
    },
    optimizeDeps: {
      include: ['react', 'react-dom', 'react-router-dom', 'antd', 'axios'],
    },
  }
})

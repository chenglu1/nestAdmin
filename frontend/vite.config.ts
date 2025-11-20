import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  
  return {
    plugins: [
      react(),
      // 修复 zrender 浏览器版本检测问题
      {
        name: 'fix-zrender-browser-version',
        enforce: 'pre',
        transform(code, id) {
          // 只处理 zrender 的 event.js 文件
          if (id.includes('zrender') && id.includes('event.js') && code.includes('browser.firefox')) {
            // 将 env.browser.version.split 替换为安全版本
            return code.replace(
              /env\.browser\.version\.split/g,
              '(env.browser.version||"0").split'
            );
          }
        }
      }
    ],
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
      'process.env.NODE_ENV': JSON.stringify(mode),
    },
    optimizeDeps: {
      include: ['react', 'react-dom', 'react-router-dom', 'antd', 'axios'],
    },
  }
})

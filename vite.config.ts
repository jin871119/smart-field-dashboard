import path from 'path';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
    const env = loadEnv(mode, '.', '');
    return {
      server: {
        port: 3000,
        host: '0.0.0.0',
        proxy: {
          '/api/gemini': {
            target: 'https://generativelanguage.googleapis.com',
            changeOrigin: true,
            rewrite: (path) => path.replace(/^\/api\/gemini/, ''),
            configure: (proxy, _options) => {
              proxy.on('proxyReq', (proxyReq, req, _res) => {
                // API 키를 쿼리 파라미터에 추가
                const apiKey = env.VITE_GEMINI_API_KEY || env.GEMINI_API_KEY || '';
                if (apiKey && !proxyReq.path.includes('key=')) {
                  const separator = proxyReq.path.includes('?') ? '&' : '?';
                  proxyReq.path += `${separator}key=${apiKey}`;
                }
              });
            },
          },
        },
      },
      plugins: [react()],
      // Vite는 VITE_ 접두사가 있는 환경 변수만 클라이언트에 노출
      // define은 빌드 타임에 치환되므로 import.meta.env를 직접 사용하는 것이 좋음
      resolve: {
        alias: {
          '@': path.resolve(__dirname, '.'),
        }
      }
    };
});

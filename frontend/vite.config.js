import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  const groqKey = env.GROQ_API_KEY || env.VITE_GROQ_API_KEY;
  const resendKey = env.RESEND_API_KEY || env.VITE_RESEND_API_KEY;

  return {
    plugins: [react()],
    server: {
      proxy: {
        '/api/groq': {
          target: 'https://api.groq.com',
          changeOrigin: true,
          rewrite: (path) => path.replace(/^\/api\/groq/, ''),
          configure: (proxy) => {
            proxy.on('proxyReq', (proxyReq) => {
              if (groqKey) {
                proxyReq.setHeader('Authorization', `Bearer ${groqKey}`);
              }
            });
          },
        },
        '/api/resend': {
          target: 'https://api.resend.com',
          changeOrigin: true,
          rewrite: (path) => path.replace(/^\/api\/resend/, ''),
          configure: (proxy) => {
            proxy.on('proxyReq', (proxyReq) => {
              if (resendKey) {
                proxyReq.setHeader('Authorization', `Bearer ${resendKey}`);
              }
            });
          },
        },
      },
    },
  };
});

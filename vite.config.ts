import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
    const env = loadEnv(mode, '.', '');
    const gasUrl = env.VITE_GOOGLE_APP_SCRIPT_URL || '';

    return {
        base: './',
        plugins: [react()],
        server: {
            proxy: {
                '/api/gas': {
                    target: gasUrl,
                    changeOrigin: true,
                    rewrite: () => '',
                    configure: (proxy) => {
                        proxy.on('proxyReq', (proxyReq) => {
                            proxyReq.setHeader('Origin', 'https://script.google.com');
                        });
                    },
                },
            },
        },
    };
})


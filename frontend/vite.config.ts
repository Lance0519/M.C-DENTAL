import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { fileURLToPath, URL } from 'node:url';

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url))
    }
  },
  server: {
    proxy: {
      '/backend/api': {
        target: 'http://localhost/Projects_1',
        changeOrigin: true,
        secure: false
      }
    }
  },
  build: {
    chunkSizeWarningLimit: 1000, // Increase limit to 1MB for better visibility
    rollupOptions: {
      output: {
        manualChunks: (id) => {
          // Vendor chunks
          if (id.includes('node_modules')) {
            // React and React DOM (include lucide-react with react to avoid initialization issues)
            if (id.includes('react') || id.includes('react-dom') || id.includes('react-router') || id.includes('lucide-react')) {
              return 'react-vendor';
            }
            // Chart libraries (likely large)
            if (id.includes('chart.js') || id.includes('recharts')) {
              return 'charts-vendor';
            }
            // UI libraries
            if (id.includes('@radix-ui') || id.includes('shadcn-ui') || id.includes('tailwind')) {
              return 'ui-vendor';
            }
            // Other vendor libraries
            return 'vendor';
          }
        }
      }
    }
  }
});

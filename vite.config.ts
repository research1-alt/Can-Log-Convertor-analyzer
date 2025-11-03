import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('node_modules')) {
            if (id.includes('xlsx')) {
              return 'vendor_xlsx';
            }
            if (id.includes('chart.js') || id.includes('react-chartjs-2')) {
              return 'vendor_chartjs';
            }
            // All other node_modules go into a general vendor chunk
            return 'vendor'; 
          }
        },
      },
    },
  },
});

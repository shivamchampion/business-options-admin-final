import path from "path";
import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";

// https://vitejs.dev/config/
export default defineConfig(({ command, mode }) => {
  // Load env file based on `mode` in the current working directory.
  // Set the third parameter to '' to load all env regardless of the `VITE_` prefix.
  const env = loadEnv(mode, process.cwd(), '');
  
  console.log(`Building for ${mode} environment (command: ${command})`);
  
  return {
    plugins: [react()],
    resolve: {
      alias: {
        "@": path.resolve(__dirname, "./src"),
      },
    },
    // Define build settings
    build: {
      outDir: 'dist',
      sourcemap: mode !== 'production',
      // Add hash to filenames for production build
      rollupOptions: {
        output: {
          manualChunks: {
            'vendor': ['react', 'react-dom'],
            'firebase': ['firebase/app', 'firebase/auth', 'firebase/firestore', 'firebase/storage'],
          }
        }
      }
    },
    // Define dev server settings
    server: {
      port: 5173, // Default dev server port
      strictPort: false, // Find another port if 5173 is in use
      proxy: {
        // Proxy API requests to the backend
        '/api': {
          target: env.VITE_API_URL || 'http://localhost:5000',
          changeOrigin: true,
          secure: mode === 'production',
        }
      }
    },
    // Define environment variables that will be statically replaced
    define: {
      'process.env.NODE_ENV': JSON.stringify(mode)
    }
  }
});
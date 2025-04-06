// vite.config.ts
import path from "path";
import { defineConfig, loadEnv } from "file:///D:/BusinessOptions/business-options-admin/node_modules/vite/dist/node/index.js";
import react from "file:///D:/BusinessOptions/business-options-admin/node_modules/@vitejs/plugin-react/dist/index.mjs";
var __vite_injected_original_dirname = "D:\\BusinessOptions\\business-options-admin";
var vite_config_default = defineConfig(({ command, mode }) => {
  const env = loadEnv(mode, process.cwd(), "");
  console.log(`Building for ${mode} environment (command: ${command})`);
  return {
    plugins: [react()],
    resolve: {
      alias: {
        "@": path.resolve(__vite_injected_original_dirname, "./src")
      }
    },
    // Define build settings
    build: {
      outDir: "dist",
      sourcemap: mode !== "production",
      // Add hash to filenames for production build
      rollupOptions: {
        output: {
          manualChunks: {
            "vendor": ["react", "react-dom"],
            "firebase": ["firebase/app", "firebase/auth", "firebase/firestore", "firebase/storage"]
          }
        }
      }
    },
    // Define dev server settings
    server: {
      port: 5173,
      // Default dev server port
      strictPort: false,
      // Find another port if 5173 is in use
      proxy: {
        // Proxy API requests to the backend
        "/api": {
          target: env.VITE_API_URL || "http://localhost:5000",
          changeOrigin: true,
          secure: mode === "production"
        }
      }
    },
    // Define environment variables that will be statically replaced
    define: {
      "process.env.NODE_ENV": JSON.stringify(mode)
    }
  };
});
export {
  vite_config_default as default
};
//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsidml0ZS5jb25maWcudHMiXSwKICAic291cmNlc0NvbnRlbnQiOiBbImNvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9kaXJuYW1lID0gXCJEOlxcXFxCdXNpbmVzc09wdGlvbnNcXFxcYnVzaW5lc3Mtb3B0aW9ucy1hZG1pblwiO2NvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9maWxlbmFtZSA9IFwiRDpcXFxcQnVzaW5lc3NPcHRpb25zXFxcXGJ1c2luZXNzLW9wdGlvbnMtYWRtaW5cXFxcdml0ZS5jb25maWcudHNcIjtjb25zdCBfX3ZpdGVfaW5qZWN0ZWRfb3JpZ2luYWxfaW1wb3J0X21ldGFfdXJsID0gXCJmaWxlOi8vL0Q6L0J1c2luZXNzT3B0aW9ucy9idXNpbmVzcy1vcHRpb25zLWFkbWluL3ZpdGUuY29uZmlnLnRzXCI7aW1wb3J0IHBhdGggZnJvbSBcInBhdGhcIjtcbmltcG9ydCB7IGRlZmluZUNvbmZpZywgbG9hZEVudiB9IGZyb20gXCJ2aXRlXCI7XG5pbXBvcnQgcmVhY3QgZnJvbSBcIkB2aXRlanMvcGx1Z2luLXJlYWN0XCI7XG5cbi8vIGh0dHBzOi8vdml0ZWpzLmRldi9jb25maWcvXG5leHBvcnQgZGVmYXVsdCBkZWZpbmVDb25maWcoKHsgY29tbWFuZCwgbW9kZSB9KSA9PiB7XG4gIC8vIExvYWQgZW52IGZpbGUgYmFzZWQgb24gYG1vZGVgIGluIHRoZSBjdXJyZW50IHdvcmtpbmcgZGlyZWN0b3J5LlxuICAvLyBTZXQgdGhlIHRoaXJkIHBhcmFtZXRlciB0byAnJyB0byBsb2FkIGFsbCBlbnYgcmVnYXJkbGVzcyBvZiB0aGUgYFZJVEVfYCBwcmVmaXguXG4gIGNvbnN0IGVudiA9IGxvYWRFbnYobW9kZSwgcHJvY2Vzcy5jd2QoKSwgJycpO1xuICBcbiAgY29uc29sZS5sb2coYEJ1aWxkaW5nIGZvciAke21vZGV9IGVudmlyb25tZW50IChjb21tYW5kOiAke2NvbW1hbmR9KWApO1xuICBcbiAgcmV0dXJuIHtcbiAgICBwbHVnaW5zOiBbcmVhY3QoKV0sXG4gICAgcmVzb2x2ZToge1xuICAgICAgYWxpYXM6IHtcbiAgICAgICAgXCJAXCI6IHBhdGgucmVzb2x2ZShfX2Rpcm5hbWUsIFwiLi9zcmNcIiksXG4gICAgICB9LFxuICAgIH0sXG4gICAgLy8gRGVmaW5lIGJ1aWxkIHNldHRpbmdzXG4gICAgYnVpbGQ6IHtcbiAgICAgIG91dERpcjogJ2Rpc3QnLFxuICAgICAgc291cmNlbWFwOiBtb2RlICE9PSAncHJvZHVjdGlvbicsXG4gICAgICAvLyBBZGQgaGFzaCB0byBmaWxlbmFtZXMgZm9yIHByb2R1Y3Rpb24gYnVpbGRcbiAgICAgIHJvbGx1cE9wdGlvbnM6IHtcbiAgICAgICAgb3V0cHV0OiB7XG4gICAgICAgICAgbWFudWFsQ2h1bmtzOiB7XG4gICAgICAgICAgICAndmVuZG9yJzogWydyZWFjdCcsICdyZWFjdC1kb20nXSxcbiAgICAgICAgICAgICdmaXJlYmFzZSc6IFsnZmlyZWJhc2UvYXBwJywgJ2ZpcmViYXNlL2F1dGgnLCAnZmlyZWJhc2UvZmlyZXN0b3JlJywgJ2ZpcmViYXNlL3N0b3JhZ2UnXSxcbiAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9LFxuICAgIC8vIERlZmluZSBkZXYgc2VydmVyIHNldHRpbmdzXG4gICAgc2VydmVyOiB7XG4gICAgICBwb3J0OiA1MTczLCAvLyBEZWZhdWx0IGRldiBzZXJ2ZXIgcG9ydFxuICAgICAgc3RyaWN0UG9ydDogZmFsc2UsIC8vIEZpbmQgYW5vdGhlciBwb3J0IGlmIDUxNzMgaXMgaW4gdXNlXG4gICAgICBwcm94eToge1xuICAgICAgICAvLyBQcm94eSBBUEkgcmVxdWVzdHMgdG8gdGhlIGJhY2tlbmRcbiAgICAgICAgJy9hcGknOiB7XG4gICAgICAgICAgdGFyZ2V0OiBlbnYuVklURV9BUElfVVJMIHx8ICdodHRwOi8vbG9jYWxob3N0OjUwMDAnLFxuICAgICAgICAgIGNoYW5nZU9yaWdpbjogdHJ1ZSxcbiAgICAgICAgICBzZWN1cmU6IG1vZGUgPT09ICdwcm9kdWN0aW9uJyxcbiAgICAgICAgfVxuICAgICAgfVxuICAgIH0sXG4gICAgLy8gRGVmaW5lIGVudmlyb25tZW50IHZhcmlhYmxlcyB0aGF0IHdpbGwgYmUgc3RhdGljYWxseSByZXBsYWNlZFxuICAgIGRlZmluZToge1xuICAgICAgJ3Byb2Nlc3MuZW52Lk5PREVfRU5WJzogSlNPTi5zdHJpbmdpZnkobW9kZSlcbiAgICB9XG4gIH1cbn0pOyJdLAogICJtYXBwaW5ncyI6ICI7QUFBbVQsT0FBTyxVQUFVO0FBQ3BVLFNBQVMsY0FBYyxlQUFlO0FBQ3RDLE9BQU8sV0FBVztBQUZsQixJQUFNLG1DQUFtQztBQUt6QyxJQUFPLHNCQUFRLGFBQWEsQ0FBQyxFQUFFLFNBQVMsS0FBSyxNQUFNO0FBR2pELFFBQU0sTUFBTSxRQUFRLE1BQU0sUUFBUSxJQUFJLEdBQUcsRUFBRTtBQUUzQyxVQUFRLElBQUksZ0JBQWdCLElBQUksMEJBQTBCLE9BQU8sR0FBRztBQUVwRSxTQUFPO0FBQUEsSUFDTCxTQUFTLENBQUMsTUFBTSxDQUFDO0FBQUEsSUFDakIsU0FBUztBQUFBLE1BQ1AsT0FBTztBQUFBLFFBQ0wsS0FBSyxLQUFLLFFBQVEsa0NBQVcsT0FBTztBQUFBLE1BQ3RDO0FBQUEsSUFDRjtBQUFBO0FBQUEsSUFFQSxPQUFPO0FBQUEsTUFDTCxRQUFRO0FBQUEsTUFDUixXQUFXLFNBQVM7QUFBQTtBQUFBLE1BRXBCLGVBQWU7QUFBQSxRQUNiLFFBQVE7QUFBQSxVQUNOLGNBQWM7QUFBQSxZQUNaLFVBQVUsQ0FBQyxTQUFTLFdBQVc7QUFBQSxZQUMvQixZQUFZLENBQUMsZ0JBQWdCLGlCQUFpQixzQkFBc0Isa0JBQWtCO0FBQUEsVUFDeEY7QUFBQSxRQUNGO0FBQUEsTUFDRjtBQUFBLElBQ0Y7QUFBQTtBQUFBLElBRUEsUUFBUTtBQUFBLE1BQ04sTUFBTTtBQUFBO0FBQUEsTUFDTixZQUFZO0FBQUE7QUFBQSxNQUNaLE9BQU87QUFBQTtBQUFBLFFBRUwsUUFBUTtBQUFBLFVBQ04sUUFBUSxJQUFJLGdCQUFnQjtBQUFBLFVBQzVCLGNBQWM7QUFBQSxVQUNkLFFBQVEsU0FBUztBQUFBLFFBQ25CO0FBQUEsTUFDRjtBQUFBLElBQ0Y7QUFBQTtBQUFBLElBRUEsUUFBUTtBQUFBLE1BQ04sd0JBQXdCLEtBQUssVUFBVSxJQUFJO0FBQUEsSUFDN0M7QUFBQSxFQUNGO0FBQ0YsQ0FBQzsiLAogICJuYW1lcyI6IFtdCn0K

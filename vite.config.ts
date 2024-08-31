import { defineConfig, UserConfig } from "vite";

export default defineConfig(({ mode }) => ({
  resolve: {
    alias: {
      littlejsengine:
        mode === "production" ? "littlejsengine/dist/littlejs.esm.min.js" : "littlejsengine/dist/littlejs.esm.js",
    },
  },
  build: {
    minify: "terser",
    terserOptions: {
      compress: {
        booleans_as_integers: true,
        drop_console: true,
        drop_debugger: true,
        passes: 4,
        toplevel: true,
        unsafe: true,
        ecma: 2020,
        unsafe_methods: true,
      },
    },
  },
}));

import { defineConfig } from "vite";

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
        drop_console: mode === "production" ? true : false,
        drop_debugger: mode === "production" ? true : false,
        passes: 4,
        toplevel: true,
        unsafe: true,
        ecma: 2020,
        unsafe_methods: true,
      },
    },
  },
}));

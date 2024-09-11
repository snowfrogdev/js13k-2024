import { defineConfig, UserConfig } from "vite";

export default defineConfig(({ mode }) => {
  let config: UserConfig = {};

  if (mode === "production") {
    config.resolve = {
      ...config.resolve,
      alias: {
        ...config.resolve?.alias,
        littlejsengine: "littlejsengine/dist/littlejs.esm.min.js",
      },
    };

    config.build = {
      minify: "terser",
      modulePreload: false,
      terserOptions: {
        ...config.build?.terserOptions,
        compress: {
          ...(config.build?.terserOptions?.compress as any),
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
    };
  }
  return config;
});

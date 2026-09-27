import { defineConfig, loadEnv } from "@rsbuild/core";
import { pluginReact } from "@rsbuild/plugin-react";

// Ambil env var yang diawali REACT_APP_ dari file .env (gaya CRA, sama kayak kantor)
const { publicVars, rawPublicVars } = loadEnv({ prefixes: ["REACT_APP_"] });

export default defineConfig({
  plugins: [pluginReact()], // biar Rsbuild ngerti JSX/TSX
  html: { template: "./public/index.html" },
  source: {
    define: {
      ...publicVars,
      "process.env": JSON.stringify(rawPublicVars), // bikin process.env.REACT_APP_* bisa dipakai di code
    },
    alias: {
      // bikin `import x from 'services/api'` jalan tanpa ../../
      atoms: "./src/atoms",
      components: "./src/components",
      hocs: "./src/hocs",
      hooks: "./src/hooks",
      models: "./src/models",
      pages: "./src/pages",
      services: "./src/services",
      utils: "./src/utils",
      variables: "./src/variables",
    },
  },
  server: { port: 3000, strictPort: true }, // port dikunci di 3000; kalau lagi dipakai, langsung gagal
});

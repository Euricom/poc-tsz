import { defineConfig } from 'vite-plus';

export default defineConfig({
  // lint: {
  //   ignorePatterns: ['dist/**', 'node_modules/**'],
  // },
  server: {
    port: Number(process.env.WEB_PORT) || 3000,
    strictPort: true,
  },
  fmt: {
    singleQuote: true,
    printWidth: 120,
  },
});

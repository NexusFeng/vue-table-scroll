import { createVuePlugin } from 'vite-plugin-vue2';
const { resolve } =  require('path');

export default {
  test: {
    globals: true,
    environment: 'jsdom',
    coverage: {
      reporter: ['text', 'json', 'html']
    }
  },
  plugins: [
    createVuePlugin({
      jsx: true
    })
  ],
  resolve: {
    alias: [
      {find: '@', replacement: resolve(__dirname, 'src')}
    ]
  },
  build: {
    rollupOptions: {
      external: ['vue'],
      output: {
        globals: {
          vue: 'Vue',
        }
      }
    },
    lib: {
      entry: 'src/components/table/index.js',
      name: 'vue-table-scroll'
    }
  }
};

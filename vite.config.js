import { createVuePlugin } from 'vite-plugin-vue2'
const { resolve } =  require('path')

export default {
  plugins: [
    createVuePlugin({
      jsx: true,
    })
  ],
  resolve: {
    alias: [
      {find: '@', replacement: resolve(__dirname, 'src')}
    ]
  }
}
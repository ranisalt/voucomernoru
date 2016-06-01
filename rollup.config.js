import {rollup} from 'rollup'
import nodeResolve from 'rollup-plugin-node-resolve'

export default {
  entry: 'static/index.js',
  format: 'iife',
  plugins: [
    nodeResolve({
      browser: true
    })
  ]
}

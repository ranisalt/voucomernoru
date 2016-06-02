import {rollup} from 'rollup'
import nodeResolve from 'rollup-plugin-node-resolve'

export default {
  entry: 'static/index.js',
  plugins: [
    nodeResolve({
      browser: true
    })
  ]
}

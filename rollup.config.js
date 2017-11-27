import pkg from './package.json';
import resolve from 'rollup-plugin-node-resolve';
import commonjs from 'rollup-plugin-commonjs';
import html from 'rollup-plugin-fill-html';

export default {
  input: pkg.module,
  output: {
    file: pkg.main,
    format: 'cjs'
  },
  plugins: [
    resolve(),
    commonjs(),
    html({
      template: 'src/index.html',
      filename: 'index.html',
      inject: 'body'
    })
  ]
};

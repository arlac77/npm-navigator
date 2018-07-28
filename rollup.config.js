import executable from 'rollup-plugin-executable';
import pkg from './package.json';
import resolve from 'rollup-plugin-node-resolve';
import commonjs from 'rollup-plugin-commonjs';
import html from 'rollup-plugin-fill-html';
import css from 'rollup-plugin-css-only';

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
    }),
    css({ output: 'dist/bundle.css' })
  ]
};

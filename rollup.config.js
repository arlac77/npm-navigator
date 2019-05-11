import builtins from "builtin-modules";
import json from "rollup-plugin-json";
import cleanup from 'rollup-plugin-cleanup';
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
    format: 'cjs',
    interop: false
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

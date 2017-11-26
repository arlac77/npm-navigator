import babel from 'rollup-plugin-babel';
import pkg from './package.json';

export default {
  input: pkg.module,
  output: {
    file: pkg.main,
    format: 'cjs'
  },
  plugins: [
    babel({
      babelrc: false,
      presets: ['env'],
      exclude: 'node_modules/**'
    })
  ]
};

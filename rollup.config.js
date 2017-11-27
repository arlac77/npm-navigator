import pkg from './package.json';
import url from 'rollup-plugin-url';

export default {
  input: pkg.module,
  output: {
    file: pkg.main,
    format: 'cjs'
  },
  plugins: [
    url({
      //  include: ['**/*.css'],
      emitFiles: true
    })
  ]
};

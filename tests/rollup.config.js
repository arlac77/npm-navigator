import babel from 'rollup-plugin-babel';
import multiEntry from 'rollup-plugin-multi-entry';

export default {
  input: 'tests/**/*-test.js',
  output: {
    file: 'build/bundle-test.js',
    format: 'cjs',
    sourcemap: true
  },
  external: ['ava'],
  plugins: [
    babel({
      babelrc: false,
      presets: ['env'],
      exclude: 'node_modules/**'
    }),
    multiEntry()
  ]
};

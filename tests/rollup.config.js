export default {
  input: 'tests/simple-test.js',
  output: {
    file: 'build/simple-test.js',
    format: 'cjs',
    sourcemap: true
  },
  external: ['ava']
};

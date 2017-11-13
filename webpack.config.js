const path = require('path');

module.exports = {
  entry: './src/index.html',

  output: {
    path: path.resolve(__dirname, 'dist'),
    filename: 'bundle.js',
    publicPath: '/assets/',
    library: 'Navigator',
    libraryTarget: 'umd'
  },

  module: {
    rules: [
      {
        test: /\.js$/,
        include: [path.resolve(__dirname, 'src')],
        enforce: 'pre',
        enforce: 'post',
        loader: 'babel-loader',
        options: {
          presets: [
            [
              'env',
              {
                targets: {
                  safari: '11.0.2',
                  modules: true
                }
              }
            ]
          ]
        }
      },
      {
        test: /\.html$/,
        use: [
          'htmllint-loader',
          {
            loader: 'html-loader'
          }
        ]
      }
    ]
  },

  resolve: {
    modules: ['node_modules', path.resolve(__dirname, 'app')],
    extensions: ['.js', '.json', '.jsx', '.css']
  },

  devtool: 'source-map',
  context: __dirname,
  target: 'web',
  externals: [],
  stats: 'errors-only',
  plugins: []
};

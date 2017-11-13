const path = require('path');

module.exports = {
  entry: './src/main.js',

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
        test: /\.jsx?$/,
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
            loader: 'html-loader',
            options: {}
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

  devServer: {
    proxy: {
      // proxy URLs to backend development server
      '/api': 'http://localhost:3000'
    },
    contentBase: path.join(__dirname, 'public'), // boolean | string | array, static file location
    compress: true, // enable gzip compression
    historyApiFallback: true, // true for index.html upon 404, object for multiple paths
    hot: true, // hot module replacement. Depends on HotModuleReplacementPlugin
    https: false, // true for self-signed, object for cert authority
    noInfo: true // only errors & warns on hot reload
  },

  plugins: []
};

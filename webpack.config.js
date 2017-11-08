const path = require('path');

module.exports = {
  entry: './app/entry',

  output: {
    path: path.resolve(__dirname, 'dist'),

    filename: 'bundle.js',
    // the filename template for entry chunks

    publicPath: '/assets/',
    // the url to the output directory resolved relative to the HTML page

    library: 'MyLibrary',
    // the name of the exported library

    libraryTarget: 'umd'
    // the type of the exported library
  },

  module: {
    rules: [
      {
        test: /\.jsx?$/,
        include: [path.resolve(__dirname, 'app')],

        //issuer: { test, include, exclude },
        // conditions for the issuer (the origin of the import)

        enforce: 'pre',
        enforce: 'post',
        // flags to apply these rules, even if they are overridden (advanced option)

        loader: 'babel-loader',
        // the loader which should be applied, it'll be resolved relative to the context
        // -loader suffix is no longer optional in webpack2 for clarity reasons
        // see webpack 1 upgrade guide

        options: {
          presets: ['es2015']
        }
        // options for the loader
      },

      {
        test: /\.html$/,

        use: [
          // apply multiple loaders and options
          'htmllint-loader',
          {
            loader: 'html-loader',
            options: {
              /* ... */
            }
          }
        ]
      }
    ]
  },

  resolve: {
    // options for resolving module requests
    // (does not apply to resolving to loaders)

    modules: ['node_modules', path.resolve(__dirname, 'app')],
    // directories where to look for modules

    extensions: ['.js', '.json', '.jsx', '.css'],

    alias: {
      // a list of module name aliases

      module: 'new-module',
      // alias "module" -> "new-module" and "module/path/file" -> "new-module/path/file"

      'only-module$': 'new-module',
      // alias "only-module" -> "new-module", but not "only-module/path/file" -> "new-module/path/file"

      module: path.resolve(__dirname, 'app/third/module.js')
      // alias "module" -> "./app/third/module.js" and "module/file" results in error
      // modules aliases are imported relative to the current context
    }
  },

  performance: {
    hints: 'warning', // enum
    maxAssetSize: 200000, // int (in bytes),
    maxEntrypointSize: 400000, // int (in bytes)
    assetFilter: function(assetFilename) {
      // Function predicate that provides asset filenames
      return assetFilename.endsWith('.css') || assetFilename.endsWith('.js');
    }
  },

  devtool: 'source-map', // enum
  // enhance debugging by adding meta info for the browser devtools
  // source-map most detailed at the expense of build speed.

  context: __dirname, // string (absolute path!)
  // the home directory for webpack
  // the entry and module.rules.loader option
  //   is resolved relative to this directory

  target: 'web', // enum
  // the environment in which the bundle should run
  // changes chunk loading behavior and available modules

  externals: ['react', /^@angular\//],
  // Don't follow/bundle these modules, but request them at runtime from the environment

  stats: 'errors-only',
  // lets you precisely control what bundle information gets displayed

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

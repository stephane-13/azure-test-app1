//const path = require('path');
//const webpack = require('webpack');

module.exports = {

  /*resolve: {
    fallback : {
      //"crypto": require.resolve("crypto-browserify"),
      //"async_hooks": false,
      //"fs": false,
      //"http": require.resolve("stream-http"),
      //"zlib": require.resolve("browserify-zlib")
    },

  },*/

  /*plugins: [
    new webpack.ProvidePlugin({
           process: 'process/browser',
    }),
  ],*/

  entry: './src/client/index.js',

  output: {
    filename: 'bundle.js',
    /*path: path.resolve(__dirname, 'dist'),*/
  },

  mode: 'production',

  optimization: {
    usedExports: true,
    // This is to prevent the code from being minified, allowing easier debugging
    minimize: false,
  },

  performance: {
    maxAssetSize: 4096000,
    maxEntrypointSize: 4096000,
  },

  /*module: {
    rules: [
      {
        test: require.resolve('jquery'),
        loader: 'expose-loader',
        options: {
          exposes: ["$", "jQuery"],
        },
      },
    ],
  },*/
};

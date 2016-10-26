const webpack = require('webpack');

module.exports = [
  {
    entry: `${__dirname}/lib/client/mainClient.js`,
    output: {
      path: `${__dirname}/dist`,
      filename: 'conspectio.min.js'
    },
    module: {
      loaders: [ 
      {
        test: /\.js$/,
        exclude: /node_modules/,
        loader: 'babel-loader',
        query: {
					presets: ['es2015']
				}
      }  
      ]
    },
    plugins: [
      new webpack.BannerPlugin('Copyright Conspectio'),
      new webpack.optimize.OccurenceOrderPlugin(),
      new webpack.optimize.UglifyJsPlugin({
        compress: { warnings: false },
      }),
    ]
  }  
];
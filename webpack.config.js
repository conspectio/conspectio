const webpack = require('webpack');

module.exports = [
  {
    entry: `${__dirname}/lib/client/mainClient.js`,
    output: {
      path: `${__dirname}/dist`,
      filename: 'conspectio.js'
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
    }
  }  
];
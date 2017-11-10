const WrapperPlugin = require('wrapper-webpack-plugin');
const path = require('path');

module.exports = {
  // webpack folder’s entry js — excluded from jekll’s build process.
  entry: './webpack/entry.js',
  output: {
    // we’re going to put the generated file in the js folder so jekyll will grab it.
    path: path.resolve(__dirname, 'js/'),
    filename: 'bundle.js',
  },
  module: {
    loaders: [
      {
        test: /\.jsx?$/,
        exclude: /(node_modules)/,
        loader: 'babel-loader',
        query: {
          presets: ['env'],
        },
      },
    ],
  },
  plugins: [
    new WrapperPlugin({
      header: '---\nnote: "this is a liquid template, processed by jekyll, for site.baseurl"\n---\n',
    }),
  ],
};

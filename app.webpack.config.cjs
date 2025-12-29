const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');

const isProduction = process.env.NODE_ENV === 'production';

module.exports = {
  mode: isProduction ? 'production' : 'development',
  entry: './app/src/index.js',
  output: {
    path: path.resolve(__dirname, 'PostgresExplain.tableplusplugin/app/dist'),
    filename: 'app.bundle.js',
    clean: true
  },
  module: {
    rules: [
      {
        test: /\.css$/,
        use: [MiniCssExtractPlugin.loader, 'css-loader']
      }
    ]
  },
  plugins: [
    new HtmlWebpackPlugin({
      template: './app/src/index.html',
      filename: 'index.html',
      inject: 'body'
    }),
    new MiniCssExtractPlugin({
      filename: 'styles.css'
    })
  ],
  devServer: {
    static: {
      directory: path.join(__dirname, 'PostgresExplain.tableplusplugin/app/dist'),
    },
    compress: true,
    port: 9000,
    hot: true,
    open: true
  },
  devtool: isProduction ? false : 'source-map'
};

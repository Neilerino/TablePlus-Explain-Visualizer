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
        test: /\.ts$/,
        use: 'ts-loader',
        exclude: /node_modules/
      },
      {
        test: /\.css$/,
        use: [MiniCssExtractPlugin.loader, 'css-loader']
      }
    ]
  },
  resolve: {
    extensions: ['.ts', '.js']
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
    static: [
      {
        directory: path.join(__dirname, 'PostgresExplain.tableplusplugin/app/dist'),
      },
      {
        directory: path.join(__dirname, 'app'),
        publicPath: '/',
      }
    ],
    compress: true,
    port: 9000,
    hot: true,
    open: true
  },
  devtool: isProduction ? false : 'source-map'
};

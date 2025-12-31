const path = require('path');

module.exports = {
  entry: './src/index.js',
  output: {
    filename: 'explain.js',
    path: path.resolve(__dirname, 'dist'),
    // Don't use library wrapper - we'll export to global manually
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
        use: ['raw-loader'] // Import CSS as string for inline embedding
      },
      {
        test: /\.bundled\.js$/,
        use: ['raw-loader'] // Import bundled libs as strings
      }
    ]
  },
  resolve: {
    extensions: ['.ts', '.js']
  },
  mode: 'production',
  devtool: 'source-map', // Helpful for debugging
  target: 'web'
};

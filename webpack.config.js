const path = require("path");
const HtmlWebpackPlugin = require("html-webpack-plugin");

module.exports = {
  entry: "./src/index.ts",
  module: {
    rules: [
      {
        test: /\.tsx?$/,
        use: "ts-loader",
        exclude: /node_modules/,
      },
      {
        test: /\.css$/,
        use: ["style-loader", "css-loader"],
      },
    ],
  },
  resolve: {
    extensions: [".tsx", ".ts", ".js"],
  },
  output: {
    filename: "bundle.js",
    path: path.resolve(__dirname, "dist"),
  },
  plugins: [
    new HtmlWebpackPlugin({
      template: "./src/index.html",
    }),
  ],
  devServer: {
    static: path.join(__dirname, "dist"),
    compress: true,
    port: 9000,
    open: true, // This will open your browser automatically
    client: {
      overlay: true, // Shows errors as overlay in browser
      progress: true, // Shows compilation progress
    },
    devMiddleware: {
      stats: 'minimal', // Shows minimal stats in console
    },
    hot: true, // Enable Hot Module Replacement
    liveReload: true, // Enable live reloading
  },
};

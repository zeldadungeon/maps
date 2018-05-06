const webpack = require("webpack");
const path = require("path");
const CleanWebpackPlugin = require("clean-webpack-plugin");
const HtmlWebpackPlugin = require("html-webpack-plugin");

module.exports = {
    mode: "production",
    context: path.resolve(__dirname, "./src"),
    entry: {
        botw: "./botw/index.ts"
    },
    output: {
        path: path.resolve(__dirname, "./dist"),
        filename: "[name]/bundle.js"
    },
    plugins: [
        new CleanWebpackPlugin(["dist"]),
        new HtmlWebpackPlugin({
            title: "Breath of the Wild Interactive Map",
            description: "Interactive, searchable map of Hyrule with locations, descriptions, guides, and more.",
            template: "template.html",
            chunks: ["botw"],
            filename: "botw/index.html"
        })
    ],
    resolve: {
        extensions: [".ts", ".tsx", ".js"],
        modules: [path.resolve("src"), "node_modules"]
    },
    devtool: "source-map", // Source maps support ("inline-source-map" also works) 
    module: {
        rules: [
            { test: /\.tsx?$/, loader: "ts-loader" },
            { test: /\.scss$/, loaders: ["style-loader", "css-loader", "sass-loader"] },
            { test: /\.(png|jpe?g|gif|svg)(\?.*)?$/, loader: "url-loader" }
        ]
    }
};
const webpack = require("webpack");
const path = require("path");
const CleanWebpackPlugin = require("clean-webpack-plugin");
const CopyWebpackPlugin = require("copy-webpack-plugin");
const HtmlWebpackPlugin = require("html-webpack-plugin");

module.exports = {
    mode: "production",
    context: path.resolve(__dirname, "./src"),
    entry: {
        botw: "./botw/index.ts",
        la: "./la/index.ts",
        botw2: "./botw2/index.ts",
        ss: "./ss/index.ts"
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
        }),
        new HtmlWebpackPlugin({
            title: "Link's Awakening Interactive Map (Nintendo Switch)",
            description: "Interactive, searchable map of Koholint with locations, descriptions, guides, and more.",
            template: "template.html",
            chunks: ["la"],
            filename: "la/index.html"
        }),
        new HtmlWebpackPlugin({
            title: "Breath of the Wild Sequel Interactive Map",
            description: "Interactive, searchable map of Hyrule with locations, descriptions, guides, and more.",
            template: "template.html",
            chunks: ["botw2"],
            filename: "botw2/index.html"
        }),
        new HtmlWebpackPlugin({
            title: "Skyward Sword Interactive Map",
            description: "Interactive, searchable map of Hyrule with locations, descriptions, guides, and more.",
            template: "template.html",
            chunks: ["ss"],
            filename: "ss/index.html"
        }),
        //new CopyWebpackPlugin(["**/*.json", "**/*.png"]),
        new webpack.ProvidePlugin({
            Promise: ["es6-promise", "Promise"]
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
            { test: /\.s?css$/, loaders: ["style-loader", "css-loader", "sass-loader"] },
            { test: /\.(png|jpe?g|gif|svg)(\?.*)?$/, loader: "url-loader" }
        ]
    }
};
const webpack = require('webpack');
const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const ExtractTextPlugin = require('extract-text-webpack-plugin');
const Dotenv = require('dotenv-webpack');

const shouldAnalyze = process.argv.indexOf('--analyze') !== -1;

//Called when building -> (see plugins)
const HTMLWebpackPluginConfig = new HtmlWebpackPlugin({
    template: path.resolve(__dirname, './app/index.html'), //path.resolve is weird https://goo.gl/6vRELG
    filename: 'index.html',
    inject: 'body'
});

const isProd = process.argv.indexOf('-p') !== -1; //are we in production?

const BundleAnalyzerPlugin = require('webpack-bundle-analyzer').BundleAnalyzerPlugin;


// Conditionally return a list of plugins to use based on the current environment.
// Repeat this pattern for any other config key (ie: loaders, etc).
function getPlugins () {
    const plugins = [];

    // Conditionally add plugins for Production builds.
    if (isProd) {
        plugins.push(new webpack.DefinePlugin({
            'process.env': {
                NODE_ENV: JSON.stringify('production')
            }
        }));
        plugins.push(new webpack.optimize.UglifyJsPlugin({
            compress: {
                drop_console: true
            }
        }));
        plugins.push(new webpack.optimize.DedupePlugin());
        plugins.push(new webpack.optimize.AggressiveMergingPlugin());
        if (shouldAnalyze) {
        plugins.push(new BundleAnalyzerPlugin({
            analyzerPort: process.env.VUE_CLI_MODERN_BUILD ? 8888 : 9999 // Prevents build errors when running --modern
        }));
        }
    } else {
        plugins.push(HTMLWebpackPluginConfig);
    }

    plugins.push(new ExtractTextPlugin('dataviewer.css', {
        allChunks: false
    }));

    plugins.push(new Dotenv());

    return plugins;
}

//app is served from app/index.html (app.js) in dev -> npm start, production files will be in ./dist -> npm run build
module.exports = {
    entry: [
        './app/app.js' //js entry point
    ],
    resolve: {
        modulesDirectories: ['app', 'node_modules']//where the import looks for module (avoid ../../../)
    },
    output: {
        filename: 'dataviewer.js',
        path: path.resolve(__dirname, './dist')//path.resolve is weird https://goo.gl/6vRELG
    },
    devtool: 'source-map', //we need source maps
    devServer: {
        inline: true,
        port: 2222//server port, change at your pleasure
    },
    module: {
        loaders: [
            {
                test: /\.(jpg|png|svg)$/,
                loader: 'file'
            },
            //load js and compile (live reload)
            {
                test: /\.js$/,
                exclude: /node_modules/,
                loader: 'babel-loader',
                query: {
                    presets: ['es2015', 'react'],
                    plugins: ['transform-object-rest-spread']
                }
            },
            //load sass and compile (live reload)
            {
                test: /\.scss$/,
                loader: ExtractTextPlugin.extract('style-loader', 'css-loader!sass-loader')
            }
        ]
    },
    plugins: getPlugins()
};


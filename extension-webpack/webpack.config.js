import path from 'path';
import {fileURLToPath} from 'url';

import HtmlWebpackPlugin from 'html-webpack-plugin';
import CopyPlugin from 'copy-webpack-plugin';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const config = {
    mode: 'development',
    devtool: 'inline-source-map',
    entry: {
        background: {
            import: './src/background.js',
            chunkLoading: `import-scripts`,
        },
        popup: './src/popup.js',
        content: './src/content.js',
    },
    output: {
        path: path.resolve(__dirname, 'build'),
        filename: '[name].js',
    },
    plugins: [
        new HtmlWebpackPlugin({
            template: './src/popup.html',
            filename: 'popup.html',
        }),
        new CopyPlugin({
            patterns: [
                {
                    from: "public",
                    to: "." // Copies to build folder
                },
                {
                    from: "src/popup.css",
                    to: "popup.css"
                },
                {from: 'node_modules/onnxruntime-web/dist/*.wasm', to: '[name][ext]'},
                // Copy the ONNX model into the dist folder
                {from: 'src/xgb.onnx', to: 'xgb.onnx'},
                {from: 'src/phishing_warning.html', to: 'phishing_warning.html'},
            ],
        })
    ],
};

export default config;

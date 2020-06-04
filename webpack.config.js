const path = require('path')

module.exports = {
    mode: 'production',
    entry: './src/index.js',
    output: {
        filename: 'js-service-wrapper.js',
        path: path.resolve(__dirname, 'lib'),
        library: 'JSServiceWrapper',
        publicPath: '/lib/',
        libraryTarget: 'umd',
        umdNamedDefine: true,
        globalObject: 'this'
    },
    module: {
        rules: [
            {
                test: /\.js?$/,
                exclude: /(node_modules)/,
                use: 'babel-loader',
            },
        ],
    },
    resolve: {
        extensions: ['.js'],
    },
}

import {terser} from 'rollup-plugin-terser';
import pkg from './package.json';

export default [
    {
        input: 'src/index.js',
        output: {
            name: "JSServiceWrapper",
            file: pkg.browser,
            format: 'umd',
        },
        plugins: [
            terser()]
    },
    {
        input: 'src/index.js',
        output: {
            file: pkg.main,
            format: 'cjs',
        }
    },
    {
        input: 'src/index.js',
        output: {
            file: pkg.module,
            format: 'es',
        }
    }
];
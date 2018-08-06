/**
 * Copyright 2018 The AMP HTML Authors. All Rights Reserved.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *      http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS-IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import {uglify} from 'rollup-plugin-uglify';
import alias from 'rollup-plugin-alias';
import babel from 'rollup-plugin-babel';
import browserifyTransform from 'rollup-plugin-browserify-transform';
import cleanup from 'rollup-plugin-cleanup';
import commonjs from 'rollup-plugin-commonjs';
import envify from 'envify';
import path from 'path';
import resolve from 'rollup-plugin-node-resolve';

export default {
  input: './amp-react-dates-export.js',

  output: {
    name: 'ReactDates',
    format: 'umd',
    file: 'build/index.js',
    sourceMap: true,
  },

  plugins: [
    alias({
      'react': path.resolve(__dirname,
          'node_modules/preact/dist/preact.js'),
      'react-dom': path.resolve(__dirname,
          'node_modules/preact-compat/dist/preact-compat.js'),
      'moment': path.resolve(__dirname,
          'node_modules/moment/min/moment-with-locales.js'),
    }),

    browserifyTransform(envify),

    babel({
      babelrc: false,
      presets: [['env', {'modules': false}]],
      plugins: ['external-helpers'],
      externalHelpers: true,
    }),

    resolve({jsnext: true}),

    commonjs(),

    cleanup(),

    uglify({
      compress: {
        'dead_code': true,
      },
      mangle: {
        reserved: ['babelHelpers'],
      //   'passes': 3,
      //   'toplevel': true,
      //   // 'unsafe': true,
      // },
      // mangle: {
      //   'toplevel': true,
      },
    }),
  ],
};

import { rollup } from 'rollup';
import ts from 'typescript';
import { existsSync, mkdirSync, rmSync } from 'fs';
import { resolve, basename } from 'path';
import { babel } from '@rollup/plugin-babel';
import { nodeResolve } from '@rollup/plugin-node-resolve';
import commonjs from '@rollup/plugin-commonjs';
import fg from 'fast-glob';

const lexicalSolidModules =
  fg.sync('./src/**')
    .map((module) => {
      const fileName =
        (module.includes('shared') ? 'shared/' : '') + basename(basename(module, '.ts'), '.tsx');
      return {
        sourceFileName: module,
        outputFileName: fileName
      };
    })

const externals = [
  'lexical',
  '@lexical/list',
  '@lexical/table',
  '@lexical/file',
  '@lexical/clipboard',
  '@lexical/hashtag',
  '@lexical/headless',
  '@lexical/html',
  '@lexical/history',
  '@lexical/selection',
  '@lexical/text',
  '@lexical/offset',
  '@lexical/utils',
  '@lexical/code',
  '@lexical/yjs',
  '@lexical/plain-text',
  '@lexical/rich-text',
  '@lexical/mark',
  '@lexical/dragon',
  '@lexical/overflow',
  '@lexical/link',
  '@lexical/markdown',
  'solid-js',
  'yjs',
  'y-websocket',
  ...(lexicalSolidModules.map(n => 'lexical-solid/' + n.outputFileName)),
]

if (existsSync('./dist')) rmSync(resolve('./dist'), { recursive: true });
mkdirSync('./dist')

for (const module of lexicalSolidModules) {
  let inputFile = resolve(module.sourceFileName);
  const inputOptions = {
    external(modulePath, src) {
      return externals.includes(modulePath);
    },
    input: inputFile,
    plugins: [
      nodeResolve({
        extensions: ['.js', '.jsx', '.ts', '.tsx'],
      }),
      babel({
        babelHelpers: 'bundled',
        babelrc: false,
        configFile: false,
        exclude: '/**/node_modules/**',
        extensions: ['.js', '.jsx', '.ts', '.tsx'],
        presets: [
          'babel-preset-solid',
          '@babel/preset-typescript',
        ]
      }),
      commonjs()
    ],
    treeshake: true,
  }
  const result = await rollup(inputOptions);
  result.write({ format: 'cjs', file: resolve('dist/cjs/' + module.outputFileName + '.cjs') })
  result.write({ format: 'esm', file: resolve('dist/esm/' + module.outputFileName) + '.js' })
  result.close()
}

const program = ts.createProgram(lexicalSolidModules.map(module => module.sourceFileName), {
  target: ts.ScriptTarget.ESNext,
  module: ts.ModuleKind.ESNext,
  moduleResolution: ts.ModuleResolutionKind.NodeJs,
  jsx: ts.JsxEmit.Preserve,
  jsxImportSource: 'solid-js',
  allowSyntheticDefaultImports: true,
  esModuleInterop: true,
  outDir: `dist/source`,
  declarationDir: `dist/types`,
  declaration: true,
  allowJs: true,
  paths: {
    'lexical-solid/*': ['./src/*']
  }
});

program.emit();
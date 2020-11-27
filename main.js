#! /usr/bin/env node

const { readFileSync, writeFileSync } = require('fs')
const { resolve, basename, dirname } = require('path')
const nunjucks = require('nunjucks')
const chokidar = require('chokidar')
const glob = require('glob')
const mkdirp = require('mkdirp')
const chalk = require('chalk').default

const { argv } = require('yargs')
	.usage('Usage: njk <file|glob> [options]')
	.example('njk foo.njk data.json', 'Compiles foo.njk to foo.html')
	.example('nunjucks *.njk -w -p src -o dist', 'Watch .njk files in ./src, compile them to ./dist')
	.demandCommand(1, 'You must provide at least a file/glob path')
	.epilogue('For more information on Nunjucks: https://mozilla.github.io/nunjucks/')
	.help()
	.alias('help', 'h')
	.alias('help', '?')
	.locale('en')
	.version("0.0.1")
	.option('path', {
		alias: 'p',
		string: true,
		requiresArg: true,
		default: '.',
		nargs: 1,
		describe: 'Path where templates live',
	})
	.option('outDir', {
		alias: ['out', 'D'],
		string: true,
		requiresArg: true,
		nargs: 1,
		describe: 'Output folder',
	})
	.option('watch', {
		alias: 'w',
		boolean: true,
		describe: 'Watch files change, except files starting by "_"',
	})
	.option('outExtension', {
		alias: 'e',
		string: true,
		requiresArg: true,
		default: 'html',
		describe: 'Extension of the rendered files',
	})
	.option('extensions', {
		alias: 'E',
		array: true,
		default: [],
		describe: 'Array of Extensions'
	})
	.option('options', {
		alias: 'O',
		string: true,
		requiresArg: true,
		nargs: 1,
		describe: 'Nunjucks options file',
	})

const inputDir = resolve(process.cwd(), argv.path) || ''
const outputDir = argv.outDir || ''

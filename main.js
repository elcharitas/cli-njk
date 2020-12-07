#! /usr/bin/env node

const { readFileSync, writeFileSync } = require('fs')
const { resolve, basename, dirname } = require('path')
const nunjucks = require('nunjucks')
const chokidar = require('chokidar')
const glob = require('glob')
const mkdirp = require('mkdirp')
const chalk = require('chalk').default

const { argv } = require('yargs')
	.usage(`${chalk.green("Usage")}: njk <file|glob> [options]`)
	.example('njk foo.njk', 'Compiles foo.njk to foo.html')
	.example('njk *.njk -r -w -p src -o dist', 'Watch .njk files in ./src, compile them to ./dist')
	.demandCommand(1, chalk.red('You must provide at least a file/glob path'))
	.epilogue(`For more information on CLI Nunjucks: ${chalk.blue("https://github.com/elcharitas/cli-njk")}\nFor more information on Nunjucks: ${chalk.blue("https://mozilla.github.io/nunjucks/")}`)
	.help()
	.alias('help', 'h')
	.alias('help', '?')
	.locale('en')
	.version('1.0.0')
	.option('path', {
		alias: 'p',
		string: true,
		requiresArg: true,
		default: '.',
		nargs: 1,
		describe: 'The Path where templates live',
	})
	.option('outDir', {
		alias: ['out', 'D'],
		string: true,
		requiresArg: true,
		default: '.',
		nargs: 1,
		describe: 'The path to output compiled templates',
	})
	.option('outFile', {
		string: true,
		describe: 'The path to file for precompiled templates',
	})
	.option('watch', {
		alias: 'w',
		boolean: true,
		describe: 'Watch files change, except files starting by "_"',
	})
	.option('render', {
		alias: 'r',
		boolean: true,
		describe: 'Whether or not to render files or precompile them, default: false',
	})
	.option('extension', {
		alias: 'e',
		string: true,
		describe: 'Extension of the rendered files',
	})
	.option('extensions', {
		alias: 'E',
		array: true,
		default: [],
		describe: 'Set of Extensions to use'
	})
	.option('options', {
		alias: 'O',
		string: true,
		requiresArg: true,
		nargs: 1,
		describe: 'Nunjucks options file',
	});

/** @type {nunjucks.ConfigureOptions} */
const nunjucksOptions = argv.options
	? JSON.parse(readFileSync(argv.options, 'utf8'))
	: { config: { trimBlocks: true, lstripBlocks: true, noCache: true }, compiler: { context: {}, extensions: [] } }

/** @type {string} */
const inputDir = resolve(process.cwd(), nunjucksOptions?.compiler?.inputDir || argv.path) || '';
/** @type {string} */
const outputDir = nunjucksOptions?.compiler?.outDir || argv.outDir || '';
/** @type {string} */
const outFile = nunjucksOptions?.compiler?.outFile || argv.outFile || ''

/** @type string[] */
const nunjucksExtensions = nunjucksOptions?.compiler?.extensions || argv.extensions || [];

/** @type {object} */
const context = nunjucksOptions?.compiler?.context || {}
// Expose environment variables to render context
context.env = process.env

/** @type {nunjucks.Environment} */
const nunjucksEnv = nunjucks.configure(inputDir, nunjucksOptions)

//register extensions and extension collection
nunjucksExtensions.forEach(extension => {
	if (extension.indexOf('./') === 0 || extension.indexOf('../') === 0) {
		extension = resolve(inputDir, extension)
	}
	var required = require(extension)
	if (typeof required === "function") {
		nunjucksEnv.addExtension(extension, new required(nunjucksEnv));
	} else if (typeof required === "object") {
		for (var sub in required) {
			nunjucksEnv.addExtension(sub, new required[sub](nunjucksEnv));
		}
	} else {
		throw new Error(`Unknown extension type ${extension}`)
	}
});

const render = (/** @type {string[]} */ files) => {
	/** @type {string} */
	let outputFile;

	if(outFile && argv.render) {
		throw new Error("Use --outFile only for precompiling templates")
	}

	if(outFile) {
		outputFile = outFile;
		writeFileSync(outputFile, "");
	}

	for (const file of files) {

		if(argv.render) {
			// No performance benefits in async rendering
			// https://mozilla.github.io/nunjucks/api.html#asynchronous-support
			const res = nunjucksEnv.render(file, context)

			outputFile = file.replace(/\.\w+$/, `.${argv.extension || "html"}`)
	
			if (outputDir && argv.render) {
				outputFile = resolve(outputDir, outputFile)
				mkdirp.sync(dirname(outputFile))
			}
		
			console.log(chalk.blue('Rendering: ' + file))
			writeFileSync(outputFile, res)
		} else {
			outputFile = outputFile || file.replace(/\.\w+$/, `.${argv.extension || "js"}`)
			console.log(chalk.blue('Precompiling: ' + file))
			let res = nunjucks.precompile(resolve(inputDir, file), {
				name: file,
				force: true,
				env: nunjucksEnv,
			})

			//append previous content
			if(outFile) {
				res += readFileSync(outputFile);
			}

			writeFileSync(outputFile, res);
		}
	}
}

/** @type {glob.IOptions} */
const globOptions = { strict: true, cwd: inputDir, ignore: '**/_*.*', nonull: true }

// Render the files given a glob pattern (except the ones starting with "_")
glob(argv._[0], globOptions, (err, files) => {
	if (err) return console.error(chalk.red(err))
	render(files)
})

// Watch files for rendering
if (argv.watch && argv.render) {
	const layouts = []
	const templates = []

	/** @type {chokidar.WatchOptions} */
	const watchOptions = { persistent: true, cwd: inputDir }
	const watcher = chokidar.watch(argv._[0], watchOptions)

	watcher.on('ready', () => console.log(chalk.gray('Watching templates...')))

	// Sort files to not render partials/layouts
	watcher.on('add', (file) => {
		if (basename(file).indexOf('_') === 0) layouts.push(file)
		else templates.push(file)
	})

	// if the file is a layout/partial, render all other files instead
	watcher.on('change', (file) => {
		if (layouts.indexOf(file) > -1) render(templates)
		else render([file])
	})
}
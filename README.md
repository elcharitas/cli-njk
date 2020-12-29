<h1 align="center">CLI Nunjucks</h1>
<p>
  <img alt="Version" src="https://img.shields.io/badge/version-1.0.0-blue.svg?cacheSeconds=2592000" />
  <a href="https://github.com/elcharitas/cli-njk#readme" target="_blank">
    <img alt="Documentation" src="https://img.shields.io/badge/documentation-yes-brightgreen.svg" />
  </a>
  <a href="https://github.com/elcharitas/cli-njk/graphs/commit-activity" target="_blank">
    <img alt="Maintenance" src="https://img.shields.io/badge/Maintained%3F-yes-green.svg" />
  </a>
  <a href="https://github.com/elcharitas/cli-njk/blob/master/LICENSE" target="_blank">
    <img alt="License: ISC" src="https://img.shields.io/github/license/elcharitas/cli-njk" />
  </a>
  <a href="https://twitter.com/elcharitas" target="_blank">
    <img alt="Twitter: elcharitas" src="https://img.shields.io/twitter/follow/elcharitas.svg?style=social" />
  </a>
</p>

> A Simple Nunjucks CLI Wrapper and templates watcher with Extension support, to generate precompiled template files or static HTML files.

## Installation

```bash
# Using NPM?
npm i -g cli-njk

# Using Yarn?
yarn add cli-njk
```

## Usage

```bash
$ njk <file|glob> [options]
```

_Just like [Nunjucks CLI][], the `process.env` object is added to the context as `env`._

#### Basic examples

```bash
$ njk foo.njk --options njk.json
```

Compiles `foo.njk` to `foo.html` with options from `njk.json` (and variables from `process.env` as `env`).

```bash
$ njk **/*.njk
```

Compiles all `.njk` files (including subdirectories), except the ones starting by `_` (so you can use them as layouts).

## CLI Options

**--help, -h, -?**

Setting this option will Display or Show the help

``` bash
$ njk --help
```

**--version**

Setting this option will Show the current version number

``` bash
$ njk -v
# 1.0.0
```

**--path, -p**

This sets the path where templates live. Defaults to the path in `process.cwd()`

``` bash
$ njk *.njk -p src
```
See <https://mozilla.github.io/nunjucks/api.html#configure>

**--outDir, --out, -D**

The path to output compiled templates

``` bash
$ njk *.njk -D dist
```

**--outFile**

The path to file for precompiled templates. When set, all discovered templates will be bundled into the file
``` bash
$ njk *.njk --outFile precompiled.js
```
See <https://mozilla.github.io/nunjucks/api.html#precompiling>

**--watch, -w**

Watch files change, except files starting by "_"

**N/B**: Template watching is only allowed for rendering and as such the `--render` flag must be used
``` bash
$ njk *.njk --watch --render
```

**--render, -r**

Whether or not to render files or precompile them. When not set, templates are precompiled and bundled if `--outFile` flag is used
``` bash
$ njk *.njk --render
# Renders static HTML 
```

**--extension, -e**

Extension of the rendered or precompiled files
``` bash
# When rendering
$ njk *.njk -r -e html

# When precompiling...
$ njk *.njk -e js
```

**--extensions, -E**

Set of Extensions to use. The extensions are included using nodejs' `require()`.

To use [Nunjucks Reactive](https://github.com/nunjucks-reactive) for instance, we can write something like this

``` bash
$ njk *.njk -E nunjucks-reactive
```
Files in the `--path` specified can also be included using their relative paths.
``` bash
$ njk *.njk -E ./wrapfile ../extender
```
See <https://mozilla.github.io/nunjucks/api.html#addextension>

**--options, -O**

Setting up an options file can come quite handy. cli nunjucks currently supports two major scopes in options
- Nunjucks options found in `config`
  ``` json
  {
    "config": {
      "trimBlocks": true,
      "lstripBlocks": true,
      "noCache": true
    }
  }
  ```
  See <https://mozilla.github.io/nunjucks/api.html#configure>
- Nunjucks Compiler options
    * Environment context
    ``` json
    {
      "compiler": {
        "context": {
          "package": "cli-njk"
      }
    }
    ```
    * Array of extensions to load. Similar to using the `-E` flag
    ``` json
    {
      "compiler": {
        "extensions": [
          "./extended",
          "nunjucks-reactive"
        ]
      }
    }
    ```
- Nunjucks CLI options

  Some other cli options are supported provided its not their alias.
  ``` json
  {
    "compiler": {
      "outDir": "dist"
    }
  }
  ```

See <https://mozilla.github.io/nunjucks/api.html#configure>

### Advanced examples

```bash
$ njk foo.njk -p src -o dist -O njk.json
```

Compiles `src/foo.njk` to `dist/foo.html`, with `njk.json` as njk environment options.

```bash
$ njk *.njk njk.json -w -r -p src
```

Compiles and renders all `.njk` files -- except ones starting with `_` -- in the `src` folder to the current working directory, with `njk.json` as metadata, and keeps running in the background for files changes.

[Nunjucks CLI]: http://github.com/jeremyben/nunjucks-cli
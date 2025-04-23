# Automated APK search and audit

A set of scripts that allows you to search for APK's given a keyword, downloads, extracts, decompiles, and then searches the decompiled APK for defined keywords.

## Install

```bash
# via npm
npm i -g apk-search-and-audit

# via git
git clone https://github.com/joshterrill/automated-apk-search-and-audit
cd automated-apk-search-and-audit/
npm i -g .
```

## Prerequisites

1. Install ripgrep so `rg` can be run from CLI.

2. Install 

Create a JSON file with the following structure:

```json
[
    {
        "keyword": "AWS_"
    },
    {
        "keyword": "FIREBASE_",
        "fileTypes": ["json", "yaml", "xml"]
    },
    {
        "keyword": "/api/",
        "fileTypes": ["json", "yaml", "xml", "smali"]
    }
]
```

When no `fileTypes` property is passed through on a keyword, it will search all files.

This file is passed in as part of the `--globs path/to/your/file.json`.

## Usage

```bash
$ apk-search-and-audit --help
Usage: apk-search-and-audit [options] [apkName]

CLI to automate APK toolchain

Arguments:
  apkName           Name of the APK to search and process

Options:
  -V, --version     output the version number
  --globs <path>    Path to a JSON file containing an array of globs
  --search-only     Only search for APKs
  --download-only   Only download APKs
  --extract-only    Only extract .xapk files
  --decompile-only  Only decompile APKs
  --loot-only       Only run loot search
  -h, --help        display help for command
```

Run the full toolchain:

```bash
apk-search-and-audit "fitness"
```

Run a specific step of the toolchain (*assuming the first step has already been completed at a previous time*)

```bash
apk-search-and-audit --download-only
apk-search-and-audit --extract-only
# etc.
```


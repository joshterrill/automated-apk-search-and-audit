#!/usr/bin/env node

const { Command } = require('commander');
const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');

const program = new Command();

program
    .name('apk-search-and-audit')
    .description('CLI to automate APK toolchain')
    .version('1.0.0')
    .argument('[apkName]', 'Name of the APK to search and process')
    .option('--globs <path>', 'Path to a JSON file containing an array of globs')
    .option('--search-only', 'Only search for APKs')
    .option('--download-only', 'Only download APKs')
    .option('--extract-only', 'Only extract .xapk files')
    .option('--decompile-only', 'Only decompile APKs')
    .option('--loot-only', 'Only run loot search')
    .action((apkName, options) => {
        console.log('APK Name:', apkName);
        const searchResultsPath = path.join(__dirname, 'tmp', `${apkName}-search-results.json`);
        const searchResultsExists = fs.existsSync(searchResultsPath);
        const isPartial = isPartialRun();

        // Globs are required in two cases:
        const needsGlobs =
            (!searchResultsExists && !isPartial) || options.lootOnly;

        if (!searchResultsExists && !apkName) {
            console.error(`❌ You must provide an apkName, since ./tmp/${apkName}-search-results.json does not exist.`);
            process.exit(1);
        }

        if (needsGlobs) {
            if (!options.globs) {
                console.error('❌ You must provide a --globs path (JSON array of glob patterns).');
                process.exit(1);
            }

            const fullGlobPath = path.resolve(options.globs);
            if (!fs.existsSync(fullGlobPath)) {
                console.error(`❌ Provided globs file does not exist: ${fullGlobPath}`);
                process.exit(1);
            }

            try {
                const content = JSON.parse(fs.readFileSync(fullGlobPath, 'utf8'));
                if (!Array.isArray(content) || !content.every(p => typeof p.keyword === 'string')) {
                    throw new Error();
                }
            } catch (e) {
                console.error(`❌ Globs file must be a JSON array of strings.`);
                process.exit(1);
            }
        }

        const steps = [
            { script: 'search-apks.js', run: !isPartial || options.searchOnly },
            { script: 'download-apks.js', run: !isPartial || options.downloadOnly },
            { script: 'extract-xapk.js', run: !isPartial || options.extractOnly },
            { script: 'decompile-apks.js', run: !isPartial || options.decompileOnly },
            { script: 'look-for-loot.js', run: !isPartial || options.lootOnly },
        ];

        runStepsSequentially(steps, apkName, searchResultsExists, options.globs);
    });

program.parse(process.argv);

function isPartialRun() {
    const opts = program.opts();
    return opts.searchOnly || opts.downloadOnly || opts.extractOnly || opts.decompileOnly || opts.lootOnly;
}

function runStepsSequentially(steps, apkName, searchResultsExists, globsPath) {
    const runNext = (i) => {
        if (i >= steps.length) return;
        const step = steps[i];
        if (!step.run) return runNext(i + 1);

        console.log(`\n▶ Running ${step.script}${apkName ? ` (with apkName: ${apkName})` : ' (without apkName)'}...\n`);

        const args = [path.join(__dirname, 'src', step.script)];
        if (apkName) args.push(apkName); // ← Always pass apkName if available
        if (globsPath) args.push('--globs', path.resolve(globsPath));

        const child = spawn('node', args, { stdio: 'inherit' });

        child.on('close', (code) => {
            if (code === 0) {
                runNext(i + 1);
            } else {
                console.error(`❌ Script ${step.script} failed with exit code ${code}`);
            }
        });
    };

    runNext(0);
}


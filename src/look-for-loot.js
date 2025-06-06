const fs = require('fs');
const path = require('path');
const { exec } = require('child_process');



const TMP_DIR = path.join(__dirname, '../tmp');
const OUTPUT_FILE = path.join(TMP_DIR, 'loot-search.json');

const args = process.argv.slice(2);
const globsFlagIndex = args.indexOf('--globs');

if (globsFlagIndex === -1 || !args[globsFlagIndex + 1]) {
    console.error('❌ You must provide a --globs path to a JSON file with an array of search entries.');
    process.exit(1);
}

const globsPath = path.resolve(args[globsFlagIndex + 1]);

let SEARCH_ENTRIES;
try {
    const raw = fs.readFileSync(globsPath, 'utf-8');
    SEARCH_ENTRIES = JSON.parse(raw);
    if (!Array.isArray(SEARCH_ENTRIES)) throw new Error();
    if (!SEARCH_ENTRIES.every(e => typeof e.keyword === 'string')) throw new Error();
} catch (err) {
    console.error('❌ Globs file must be a valid JSON array of objects like { keyword: "KEY", fileTypes?: ["ext"] }');
    process.exit(1);
}

function runCommand(command) {
    return new Promise((resolve, reject) => {
        exec(command, { maxBuffer: 1024 * 1024 * 10 }, (error, stdout, stderr) => {
            if (stdout) resolve(stdout.trim());
            else reject(stderr || error);
        });
    });
}

async function searchApkFolders() {
    const lootResults = [];

    try {
        const dirs = await fs.promises.readdir(TMP_DIR, { withFileTypes: true });
        const apkDirs = dirs.filter(dir => dir.isDirectory()).map(dir => dir.name);

        for (const apkDir of apkDirs) {
            const apkPath = path.join(TMP_DIR, apkDir);
            console.log(`\n🔍 Searching in directory: ${apkDir}`);

            for (const entry of SEARCH_ENTRIES) {
                const { keyword, fileTypes } = entry;

                let typeArgs = '';

                if (Array.isArray(fileTypes) && fileTypes.length > 0) {
                    typeArgs = fileTypes.map(ext => {
                        return ext === 'smali' ? '--glob "*.smali"' : `--type ${ext}`;
                    }).join(' ');
                }

                const command = `rg -i --hidden ${typeArgs} "${keyword}" "${apkPath}"`;

                try {
                    const result = await runCommand(command);
                    console.log(`✅ Found "${keyword}" in ${apkDir}`);

                    lootResults.push({
                        apkDir,
                        keyword,
                        fileTypes: fileTypes || 'all',
                        matches: result.split('\n').map(line => line.trim())
                    });
                } catch (err) {
                    console.log(`❌ No matches for "${keyword}"`);
                }
            }
        }

        // Display all loot
        if (lootResults.length > 0) {
            console.log(`\n📦 Loot Summary:\n`);
            lootResults.forEach(entry => {
                console.log(`🔑 Keyword: "${entry.keyword}" (Types: ${Array.isArray(entry.fileTypes) ? entry.fileTypes.join(', ') : 'all'}) in ${entry.apkDir}`);
                entry.matches.forEach(m => console.log(`   → ${m}`));
            });

            await fs.promises.writeFile(OUTPUT_FILE, JSON.stringify(lootResults, null, 2), 'utf-8');
            console.log(`\n💾 Results saved to: ${OUTPUT_FILE}`);
        } else {
            console.log('\n🚫 No loot found.');
        }

    } catch (error) {
        console.error(`🚨 Error:`, error);
    }
}

searchApkFolders();

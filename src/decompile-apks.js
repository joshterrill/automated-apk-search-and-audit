const fs = require('fs');
const path = require('path');
const { exec } = require('child_process');
const fsp = fs.promises;

const TMP_DIR = path.join(__dirname, '../tmp');
const SEARCH_RESULTS_PATH = path.join(TMP_DIR, 'search-results.json');

function runCommand(command) {
    return new Promise((resolve, reject) => {
        exec(command, (error, stdout, stderr) => {
            if (error) {
                reject(`Error: ${stderr}`);
            }
            resolve(stdout);
        });
    });
}

async function processApks() {
    try {
        const apps = JSON.parse(await fsp.readFile(SEARCH_RESULTS_PATH, 'utf-8'));

        const dirs = await fsp.readdir(TMP_DIR, { withFileTypes: true });

        for (const app of apps) {
            try {
                const apkName = app.url.split('/').pop() + '.apk';
                const apkDir = apkName.replace('.apk', '');
                const apkFilePath = path.join(TMP_DIR, apkDir, `${apkName}`);
                console.log('Checking for APK at path:', apkFilePath);

                if (dirs.some(dir => dir.isDirectory() && dir.name === apkDir)) {
                    // Check if the APK exists within the directory
                    if (fs.existsSync(apkFilePath)) {
                        console.log(`APK file ${apkName} exists, proceeding with decompiling.`);
                        const cmd = `apktool d ${apkFilePath} -o ${path.join(TMP_DIR, apkDir, 'decompiled')}`;
                        await runCommand(cmd);
                        console.log(`Decompiled ${apkName} into ${apkDir}/`);
                    } else {
                        console.log(`APK file ${apkName} does not exist, assuming it's already extracted.`);
                    }
                } else {
                    console.log(`Directory for ${apkName} does not exist, skipping.`);
                }
            } catch (error) {
                console.error(`Error processing app ${app.title}: ${error.message}`);
            }

        }
    } catch (error) {
        console.log(error);
        console.error(`Error processing APKs: ${error.message}`);
    }
}

processApks();

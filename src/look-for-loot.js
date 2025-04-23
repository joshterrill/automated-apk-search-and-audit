const fs = require('fs');
const path = require('path');
const { exec } = require('child_process');

const TMP_DIR = path.join(__dirname, '../tmp');
const KEYWORDS = ['AWS_', 'firebase', 'GOOGLE_APP', 'SQUARE'];


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


async function searchApkFolders() {
    try {
        const dirs = await fs.promises.readdir(TMP_DIR, { withFileTypes: true });
        const apkDirs = dirs.filter(dir => dir.isDirectory()).map(dir => dir.name);

        for (const apkDir of apkDirs) {
            try {
                console.log(`Searching in directory: ${apkDir}`);
                for (const keyword of KEYWORDS) {

                    const command = `rg -i "${keyword}" ${path.join(TMP_DIR, apkDir)}`;
                    console.log(`Running command: ${command}`);

                    const result = await runCommand(command);
                    if (result.trim()) {
                        console.log(`Found keyword "${keyword}" in directory "${apkDir}":`);
                        console.log(result);
                    } else {
                        console.log(`No matches found for keyword "${keyword}" in directory "${apkDir}".`);
                    }
                }
            } catch (error) {
                console.error(`Error processing directory ${apkDir}: ${error.message}`);
            }

        }
    } catch (error) {
        console.log(error);
        console.error(`Error searching APK folders: ${error.message}`);
    }
}

searchApkFolders();

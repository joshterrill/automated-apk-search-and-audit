const fs = require('fs');
const path = require('path');
const axios = require('axios');
const cliProgress = require('cli-progress');

const TMP_DIR = path.join(__dirname, '../tmp');
const SEARCH_RESULTS_PATH = path.join(TMP_DIR, 'search-results.json');

let lastErroredPackage = null;

if (!fs.existsSync(TMP_DIR)) {
    fs.mkdirSync(TMP_DIR);
}

function extractApkName(url) {
    const parts = url.split('/');
    return parts[parts.length - 1];
}

async function downloadXapk(apkName) {
    const downloadUrl = `https://d.apkpure.com/b/XAPK/${apkName}?version=latest`;
    const outputPath = path.join(TMP_DIR, `${apkName}.xapk`);

    try {
        console.log(`Downloading: ${apkName}`);

        const response = await axios({
            method: 'GET',
            url: downloadUrl,
            responseType: 'stream',
            headers: {
                'User-Agent': 'Mozilla/5.0'
            }
        });

        const totalLength = parseInt(response.headers['content-length'], 10);

        const progressBar = new cliProgress.SingleBar({
            format: `  {bar} {percentage}% | {value}/{total} bytes`,
            barCompleteChar: '█',
            barIncompleteChar: '░',
            hideCursor: true
        });

        progressBar.start(totalLength, 0);

        let downloaded = 0;
        response.data.on('data', chunk => {
            downloaded += chunk.length;
            progressBar.update(downloaded);
        });

        const writer = fs.createWriteStream(outputPath);
        response.data.pipe(writer);

        return new Promise((resolve, reject) => {
            writer.on('finish', () => {
                progressBar.stop();
                console.log(`✅ Saved to: ${outputPath}`);
                resolve();
            });
            writer.on('error', err => {
                progressBar.stop();
                reject(err);
            });
        });

    } catch (error) {
        if (lastErroredPackage === apkName) {
            console.error(`❌ Failed to download ${apkName} again: ${error.message}`);
            return;
        }
        console.error(`⚠️  Retrying download for ${apkName}...`);
        lastErroredPackage = apkName;
        await new Promise(resolve => setTimeout(resolve, 2000)); // wait for 2 seconds before retrying
        await downloadXapk(apkName);
    }
}

async function main() {
    const apps = JSON.parse(fs.readFileSync(SEARCH_RESULTS_PATH, 'utf-8'));

    for (const app of apps) {
        const apkName = extractApkName(app.url);
        if (apkName) {
            await downloadXapk(apkName);
        } else {
            console.warn(`⚠️ Could not extract APK name from URL: ${app.url}`);
        }
    }
}

main();

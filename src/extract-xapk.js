const fs = require('fs');;
const fsp = fs.promises;
const path = require('path');
const unzipper = require('unzipper');

const TMP_DIR = path.join(__dirname, '../tmp');

async function ensureTmpDir() {
    try {
        await fsp.access(TMP_DIR);
    } catch (err) {
        await fsp.mkdir(TMP_DIR);
    }
}

async function renameXapkToZip(files) {
    for (const file of files) {
        const oldPath = path.join(TMP_DIR, file);
        const newPath = path.join(TMP_DIR, file.replace('.xapk', '.zip'));
        await fsp.rename(oldPath, newPath);
        console.log(`Renamed ${file} to ${file.replace('.xapk', '.zip')}`);
    }
}

async function unzipFiles(files) {
    for (const file of files) {
        console.log(file);
        const zipPath = path.join(TMP_DIR, file.replace('.xapk', '.zip'));
        const outputDir = path.join(TMP_DIR, file.replace('.zip', ''));
        console.log(`Unzipping ${file} to ${outputDir}`);

        try {
            await fsp.mkdir(outputDir, { recursive: true });
            await new Promise((resolve, reject) => {
                fs.createReadStream(zipPath)
                    .pipe(unzipper.Extract({ path: outputDir }))
                    .on('close', resolve)
                    .on('error', reject);
            });
            console.log(`Unzipped ${file}`);
        } catch (err) {
            console.error(`Error unzipping ${file}:`, err);
        }
    }
}

async function main() {
    await ensureTmpDir();
    console.log('test')

    const allFiles = await fsp.readdir(TMP_DIR);
    let files = allFiles.filter(file => file.endsWith('.xapk'));
    if (files.length > 0) {
        await renameXapkToZip(files);
    }
    files = allFiles.filter(file => file.endsWith('.zip'));
    
    await unzipFiles(files);

    console.log('All files unzipped successfully.');
}

main().catch(console.error);

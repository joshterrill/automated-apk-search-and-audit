const fs = require('fs');;
const fsp = fs.promises;
const path = require('path');
const AdmZip = require('adm-zip');

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

    files.filter(file => path.extname(file).toLowerCase() === '.zip')
        .forEach(zipFile => {
            const zipPath = path.join(TMP_DIR, zipFile);
            const baseName = path.basename(zipFile, '.zip');
            const outputDir = path.join(TMP_DIR, baseName);

            try {
                const zip = new AdmZip(zipPath);
                zip.extractAllTo(outputDir, true);
                console.log(`Extracted "${zipFile}" to "${outputDir}"`);
            } catch (extractErr) {
                console.error(`Failed to extract ${zipFile}:`, extractErr);
            }
        });

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

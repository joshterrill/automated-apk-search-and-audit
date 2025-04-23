const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');

const TMP_DIR = path.join(__dirname, '../tmp');
const SEARCH_RESULTS_PATH = path.join(TMP_DIR, 'search-results.json');

if (!fs.existsSync(TMP_DIR)) {
    fs.mkdirSync(TMP_DIR);
}

function sanitizeQuery(query) {
    return query.replace(/[^a-zA-Z0-9 ]/g, '').replace(/\s+/g, '+');
}

async function searchApkPure(query) {
    const sanitizedQuery = sanitizeQuery(query);
    const url = `https://apkpure.com/search?q=${sanitizedQuery}`;

    const browser = await puppeteer.launch({ headless: true });
    const page = await browser.newPage();

    await page.setExtraHTTPHeaders({
        "accept-language": "en-US,en;q=0.9",
        "accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7",
        "accept-language": "en-US,en;q=0.9",
        "cache-control": "no-cache",
        "pragma": "no-cache",
        "priority": "u=0, i",
        "sec-ch-ua": "\"Google Chrome\";v=\"135\", \"Not-A.Brand\";v=\"8\", \"Chromium\";v=\"135\"",
        "sec-ch-ua-mobile": "?0",
        "sec-ch-ua-platform": "\"macOS\"",
        "sec-fetch-dest": "document",
        "sec-fetch-mode": "navigate",
        "sec-fetch-site": "same-origin",
        "sec-fetch-user": "?1",
        "upgrade-insecure-requests": "1",
        "Referer": "https://apkpure.com/",
        "Referrer-Policy": "no-referrer-when-downgrade"
    });

    await page.setUserAgent(
        "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/135.0.0.0 Safari/537.36"
    );

    try {
        await page.goto(url, { waitUntil: 'networkidle2' });

        const results = await page.evaluate(() => {
            const items = [];
            document.querySelectorAll('.search-res a').forEach((anchor) => {
                const url = anchor.getAttribute('href');
                const titleElement = anchor.querySelector('.p1');
                const title = titleElement ? titleElement.innerText.trim() : '';
                if (title && url) {
                    items.push({
                        title,
                        url,
                    });
                }
            });
            return items;
        });

        await browser.close();
        return results;
    } catch (error) {
        console.error('Error fetching data from APKPure:', error);
        await browser.close();
        return [];
    }
}

(async () => {
    const query = process.argv[2];
    if (!query) {
        console.error('Please provide a search query.');
        process.exit(1);
    }
    const results = await searchApkPure(query);
    fs.writeFileSync(SEARCH_RESULTS_PATH, JSON.stringify(results, null, 2));
})();

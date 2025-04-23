const puppeteer = require('puppeteer');
const fs = require('fs');

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
        "cookie": "_apk_uid=ycW6w73EiEjxfczkG2a3jD3G4YbKKtGX; _user_tag=j%3A%7B%22language%22%3A%22en%22%2C%22source_language%22%3A%22en-US%22%2C%22country%22%3A%22US%22%7D; apkpure__lang=en; apkpure__country=US; _qimei=dhApbN9z3naKDJMJCZKQh2mSQaA64zHn; recommend_id=; m1=20201; m2=7cd5a26a4dfd47bd0a32d061d8acf066; download_id=otr_1279804734120918; apkpure__sample=0.9110836746766741; _dt_sample=0.40141582439214996; _dt_referrer_fix=0.6678157129770232; _tag_sample=0.952258735868865; _home_article_entry_sample=0.6710096536947339; _related_recommend=0.26107348261195895; _download_detail_sample=0.4945965518989679; _f_sp=1361922971; _gid=GA1.2.1769789412.1745354454; AMP_TOKEN=%24NOT_FOUND; _ga=GA1.1.1798001162.1745011478; _ga_NT1VQC8HKJ=GS1.1.1745417698.5.1.1745417703.55.0.0; __gsas=ID=26481f2a921e2bdb:T=1745417703:RT=1745417703:S=ALNI_MZLnMHpbhevA5OITT7pplXvVJ7x4Q; _apk_sid=1.1.1745417698102.4.3.1745417968766.-480; apkpure__policy_review_new=only; apkpure__policy_review=20180525",
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
    const query = 'amalfi jets';
    const results = await searchApkPure(query);
    fs.writeFileSync('./tmp/search-results.json', JSON.stringify(results, null, 2));
})();

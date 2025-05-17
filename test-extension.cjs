const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');
const csv = require('csv-parser');
const {log} = require('console');

// Path to your unpacked Chrome extension
const EXTENSION_PATH = path.resolve(__dirname, 'extension-webpack/build');

// Read URLs and labels from the dataset
const urls = [];
fs.createReadStream('test_data.csv')
    .pipe(csv())
    .on('data', (row) => {
        if (row.url && row.status) {
            urls.push({url: row.url.trim(), label: row.status.trim()});
        }
    })
    .on('end', async () => {
        // Output file to store results
        const OUTPUT_FILE = 'results.csv';

        // Initialize the output file with headers
        // fs.writeFileSync(OUTPUT_FILE, 'URL,TrueLabel,Prediction,Warnings,LoadTime(ms),JSHeapUsedSize(bytes),Error\n', 'utf-8');

        // Launch Puppeteer with the extension loaded
        const browser = await puppeteer.launch({
            headless: false, // Extensions only work in non-headless mode
            args: [`--disable-extensions-except=${EXTENSION_PATH}`, `--load-extension=${EXTENSION_PATH}`, '--no-sandbox', '--disable-setuid-sandbox'],
            defaultViewport: null,
            ignoreDefaultArgs: ['--disable-extensions']
        });
        // Wait for the extension to load
        await new Promise(resolve => setTimeout(resolve, 5000));

        for (const {url, label} of urls) {
            const page = await browser.newPage();
            console.log(`Processing URL: ${url}`);
            try {
                // Handle failed requests
                // page.on('requestfailed', request => {
                //     console.error(`Request failed: ${request.url()} - ${request.failure().errorText}`);
                // });

                // Navigate to the URL
                await page.goto(url, {
                    waitUntil: 'networkidle2', // Wait for the network to be idle
                    timeout: 10000
                });

                const startTime = Date.now();
                let payload = null;
                const maxRetries = 300;
                let retries = 0;

                while (retries < maxRetries) {
                    payload = await page.evaluate(() => {
                        const bridge = document.getElementById('phishing-detector-bridge');
                        if (bridge) {
                            try {
                                return JSON.parse(bridge.innerText);
                            } catch (e) {
                                return null;
                            }
                        }
                        return null;
                    });

                    if (payload) break;

                    await new Promise(resolve => setTimeout(resolve, 20));  // wait 200ms
                    retries++;
                }

                // End timing
                const endTime = Date.now();
                const loadTime = endTime - startTime;

                // Get JS heap size
                const metrics = await page.metrics();
                const jsHeapUsedSizeMB = metrics.JSHeapUsedSize / 1024 / 1024;
                const score = payload ? payload.score : null;
                const phishingWarnings = payload ? payload.warnings || [] : [];

                // Write the result to the output file, including warnings
                fs.appendFileSync(OUTPUT_FILE, `${url},${label},${score},"${phishingWarnings.join('; ')}",${loadTime},${jsHeapUsedSizeMB},\n`, 'utf-8');

                console.log(`Processed: ${url} - Label: ${label} - Phishing Detected: ${score} - Warnings: ${phishingWarnings.join('; ')} - Load Time: ${loadTime} ms - JS Heap Used Size: ${jsHeapUsedSizeMB} MB`);
                await page.close();

            } catch (error) {
                console.error(`Error processing ${url}:`, error.message);
                fs.appendFileSync(OUTPUT_FILE, `${url},${label},null,${error.message},null,null\n`, 'utf-8');
                if (page) {
                    await page.close();
                }
            }
        }
        await browser.close();
    });

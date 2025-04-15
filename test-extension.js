const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');
const csv = require('csv-parser');
const { log } = require('console');

// Path to your unpacked Chrome extension
const EXTENSION_PATH = path.resolve(__dirname, 'extension');

// Read URLs and labels from the dataset
const urls = [];
fs.createReadStream('sample_data.csv')
    .pipe(csv())
    .on('data', (row) => {
        if (row.url && row.status) {
            urls.push({ url: row.url.trim(), label: row.status.trim() });
        }
    })
    .on('end', async () => {
        // Output file to store results
        const OUTPUT_FILE = 'results.csv';

        // Initialize the output file with headers
        fs.writeFileSync(OUTPUT_FILE, 'URL,TrueLabel,PhishingDetected,Score,Warnings,LoadTime(ms),JSHeapUsedSize(bytes),Error\n', 'utf-8');

        try {
            // Launch Puppeteer with the extension loaded
            const browser = await puppeteer.launch({
                headless: false, // Extensions only work in non-headless mode
                args: [
                    `--disable-extensions-except=${EXTENSION_PATH}`,
                    `--load-extension=${EXTENSION_PATH}`,
                    '--no-sandbox',
                    '--disable-setuid-sandbox'
                ],
                defaultViewport: null,
                ignoreDefaultArgs: ['--disable-extensions']
            });

            const page = await browser.newPage();

            // Set a longer timeout for page loads
            page.setDefaultNavigationTimeout(30000);

            //   // Enable request interception
            //   await page.setRequestInterception(true);

            // Handle failed requests
            page.on('requestfailed', request => {
                console.error(`Request failed: ${request.url()} - ${request.failure().errorText}`);
            });


            for (const { url, label } of urls) {
                try {
                    console.log(`Processing URL: ${url}`);

                    // Start timing
                    const startTime = Date.now();

                    let phishingDetected = false;
                    let phishingScore = 0;
                    let phishingWarnings = [];

                    // Wait for phishing detection complete message
                    const detectionPromise = new Promise((resolve) => {
                        const onConsole = (msg) => {
                            const text = msg.text();
                            console.log(`[Console] ${text}`);

                            // Listen for the phishing check results log
                            if (text.startsWith('[Content] Sending phishing check results:')) {
                                try {
                                    // Extract the JSON object from the log
                                    const match = text.match(/\{.*\}$/);
                                    if (match) {
                                        const result = JSON.parse(match[0]);
                                        phishingScore = result.score;
                                        phishingWarnings = result.warnings || [];
                                        phishingDetected = phishingScore > 0;
                                    }
                                } catch (e) {
                                    console.error('Failed to parse phishing check results:', e);
                                }
                            }

                            if (text.includes('Phishing detection complete')) {
                                page.off('console', onConsole);
                                resolve();
                            }
                        };
                        page.on('console', onConsole);
                    });

                    // Navigate to the URL
                    const response = await page.goto(url, {
                        waitUntil: 'networkidle0',
                        timeout: 30000
                    });

                    await detectionPromise;

                    // End timing
                    const endTime = Date.now();
                    const loadTime = endTime - startTime;

                    // Get JS heap size
                    const metrics = await page.metrics();
                    const jsHeapUsedSize = metrics.JSHeapUsedSize;

                    // Write the result to the output file, including warnings
                    fs.appendFileSync(
                        OUTPUT_FILE,
                        `${url},${label},${phishingDetected},${phishingScore},"${phishingWarnings.join('; ')}",${loadTime},${jsHeapUsedSize},\n`,
                        'utf-8'
                    );

                    console.log(`Processed: ${url} - True Label: ${label} - Phishing Detected: ${phishingDetected} - Score: ${phishingScore} - Warnings: ${phishingWarnings.join('; ')} - Load Time: ${loadTime} ms - JS Heap Used Size: ${jsHeapUsedSize} bytes`);
                } catch (error) {
                    console.error(`Error processing ${url}:`, error.message);
                    fs.appendFileSync(
                        OUTPUT_FILE,
                        `${url},${label},false,0,0,${error.message}\n`,
                        'utf-8'
                    );
                }
            }

            await browser.close();
        } catch (error) {
            console.error('Browser initialization error:', error);
        }
    });

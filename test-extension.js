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

            // Handle failed requests
            page.on('requestfailed', request => {
                console.error(`Request failed: ${request.url()} - ${request.failure().errorText}`);
            });
            // page.on('console', msg => console.log('PAGE LOG:', msg.text));


            for (const { url, label } of urls) {
                try {
                    console.log(`Processing URL: ${url}`);

                    // Start timing
                    const startTime = Date.now();

                    // Navigate to the URL
                    await page.goto(url, {
                        waitUntil: 'networkidle0',
                        timeout: 30000
                    });
                    
                    let payload = null;
                    const maxRetries = 20;
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
                  
                      await new Promise(resolve => setTimeout(resolve, 2000000));  // wait 200ms
                      retries++;
                    }

                    // End timing
                    const endTime = Date.now();
                    const loadTime = endTime - startTime;

                    // Get JS heap size
                    const metrics = await page.metrics();
                    const jsHeapUsedSizeMB = metrics.JSHeapUsedSize / 1024 / 1024;
                    const phishingScore = payload.score;
                    const phishingWarnings = payload.warnings;
                    const phishingDetected = phishingScore >= 3;
                    const isActualPhishing = label == 1;

                    // Write the result to the output file, including warnings
                    fs.appendFileSync(
                        OUTPUT_FILE,
                        `${url},${isActualPhishing},${phishingDetected},${phishingScore},"${phishingWarnings.join('; ')}",${loadTime},${jsHeapUsedSizeMB},\n`,
                        'utf-8'
                    );

                    console.log(`Processed: ${url} - True Label: ${isActualPhishing} - Phishing Detected: ${phishingDetected} - Score: ${phishingScore} - Warnings: ${phishingWarnings.join('; ')} - Load Time: ${loadTime} ms - JS Heap Used Size: ${jsHeapUsedSizeMB} MB`);
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

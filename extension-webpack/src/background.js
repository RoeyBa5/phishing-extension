import {pipeline} from '@huggingface/transformers';
import * as ort from "onnxruntime-web"

ort.env.wasm.numThreads = 1;
const wasmPath = chrome.runtime.getURL('ort-wasm-simd-threaded.wasm');
ort.env.wasm.wasmPaths = {'ort-wasm-simd-threaded.jsep.wasm': wasmPath};

let session = null;

async function loadModel() {
    if (!session) {
        const modelUrl = chrome.runtime.getURL('xgb.onnx');
        session = await ort.InferenceSession.create(modelUrl, {
            executionProviders: ['wasm']
        });
        console.log('Model loaded');
    }
}

await loadModel();

// --- Singleton for URL classification
class UrlPipelineSingleton {
    static task = 'text-classification';
    static model = 'roeyba5/urlbert-tiny-v4-phishing-classifier-xenova';
    static instance = null;

    static async getInstance(progress_callback = null) {
        this.instance ??= pipeline(this.task, this.model, {progress_callback});
        return this.instance;
    }
}

await UrlPipelineSingleton.getInstance();

// --- Store phishing results
let phishingResults = {};

// --- Listen for messages from content script
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    console.log('[Background] Received message:', request);

    if (request.type === 'pageData') {
        detectPhishing(request.url, request.features).then(result => {
            handlePhishingResults(sender.tab.id, result);
            sendResults(sender.tab.id, result);
        });
        return true; // Tell Chrome you want to respond async
    }
});

// --- Clean up results when tab is closed
chrome.tabs.onRemoved.addListener((tabId) => {
    console.log('[Background] Cleaning up results for tab:', tabId);
    delete phishingResults[tabId];
});

async function detectPhishing(url, features) {
    try {
        const urlClassifier = await UrlPipelineSingleton.getInstance();
        const urlResult = await urlClassifier(url);
        features['url_bert_classification'] = urlResult[0].label === "LABEL_1" ? urlResult[0].label : 1 - urlResult[0].score;
        const modelOutput = await classify(features);
        // log the type of the model output

        return {
            score: modelOutput,
        };

    } catch (err) {
        console.error("Error during phishing detection:", err);
        return {
            score: null, warnings: ["Detection error"]
        };
    }
}

async function classify(features) {
    const FEATURE_ORDER = ['length_hostname', 'ip', 'nb_dots', 'nb_hyphens', 'nb_at', 'nb_qm', 'nb_eq', 'nb_underscore', 'nb_slash', 'nb_www', 'ratio_digits_url', 'ratio_digits_host', 'prefix_suffix', 'shortening_service', 'length_words_raw', 'shortest_word_path', 'longest_words_raw', 'longest_word_path', 'phish_hints', 'domain_in_brand', 'suspecious_tld', 'nb_hyperlinks', 'ratio_extHyperlinks', 'login_form', 'external_favicon', 'links_in_tags', 'safe_anchor', 'empty_title', 'domain_in_title', 'domain_with_copyright', 'external_brand_logo', 'suspicious_js_patterns', 'url_bert_classification']
    const inputArray = Float64Array.from(FEATURE_ORDER.map(key => features[key]).flat());
    const inputTensor = new ort.Tensor("float32", Float32Array.from(inputArray), [1, FEATURE_ORDER.length]);
    console.log("Input Tensor:", inputTensor);
    const feeds = {[session.inputNames[0]]: inputTensor};
    const output = await session.run(feeds);
    const score = output[session.outputNames[0]].data[0];
//     convert bigint to tint
    return Number(score);
}

const ALLBRANDS = ["accenture", "activisionblizzard", "adidas", "adobe", "adultfriendfinder", "agriculturalbankofchina", "akamai", "alibaba", "aliexpress", "alipay", "alliance", "alliancedata", "allianceone", "allianz", "alphabet", "amazon", "americanairlines", "americanexpress", "americantower", "andersons", "apache", "apple", "arrow", "ashleymadison", "audi", "autodesk", "avaya", "avisbudget", "avon", "axa", "badoo", "baidu", "bankofamerica", "bankofchina", "bankofnewyorkmellon", "barclays", "barnes", "bbc", "bbt", "bbva", "bebo", "benchmark", "bestbuy", "bim", "bing", "biogen", "blackstone", "blogger", "blogspot", "bmw", "bnpparibas", "boeing", "booking", "broadcom", "burberry", "caesars", "canon", "cardinalhealth", "carmax", "carters", "caterpillar", "cheesecakefactory", "chinaconstructionbank", "cinemark", "cintas", "cisco", "citi", "citigroup", "cnet", "coca-cola", "colgate", "colgate-palmolive", "columbiasportswear", "commonwealth", "communityhealth", "continental", "dell", "deltaairlines", "deutschebank", "disney", "dolby", "dominos", "donaldson", "dreamworks", "dropbox", "eastman", "eastmankodak", "ebay", "edison", "electronicarts", "equifax", "equinix", "expedia", "express", "facebook", "fedex", "flickr", "footlocker", "ford", "fordmotor", "fossil", "fosterwheeler", "foxconn", "fujitsu", "gap", "gartner", "genesis", "genuine", "genworth", "gigamedia", "gillette", "github", "global", "globalpayments", "goodyeartire", "google", "gucci", "harley-davidson", "harris", "hewlettpackard", "hilton", "hiltonworldwide", "hmstatil", "honda", "hsbc", "huawei", "huntingtonbancshares", "hyundai", "ibm", "ikea", "imdb", "imgur", "ingbank", "insight", "instagram", "intel", "jackdaniels", "jnj", "jpmorgan", "jpmorganchase", "kelly", "kfc", "kindermorgan", "lbrands", "lego", "lennox", "lenovo", "lindsay", "linkedin", "livejasmin", "loreal", "louisvuitton", "mastercard", "mcdonalds", "mckesson", "mckinsey", "mercedes-benz", "microsoft", "microsoftonline", "mini", "mitsubishi", "morganstanley", "motorola", "mrcglobal", "mtv", "myspace", "nescafe", "nestle", "netflix", "nike", "nintendo", "nissan", "nissanmotor", "nvidia", "nytimes", "oracle", "panasonic", "paypal", "pepsi", "pepsico", "philips", "pinterest", "pocket", "pornhub", "porsche", "prada", "rabobank", "reddit", "regal", "royalbankofcanada", "samsung", "scotiabank", "shell", "siemens", "skype", "snapchat", "sony", "soundcloud", "spiritairlines", "spotify", "sprite", "stackexchange", "stackoverflow", "starbucks", "swatch", "swift", "symantec", "synaptics", "target", "telegram", "tesla", "teslamotors", "theguardian", "homedepot", "piratebay", "tiffany", "tinder", "tmall", "toyota", "tripadvisor", "tumblr", "twitch", "twitter", "underarmour", "unilever", "universal", "ups", "verizon", "viber", "visa", "volkswagen", "volvocars", "walmart", "wechat", "weibo", "whatsapp", "wikipedia", "wordpress", "yahoo", "yamaha", "yandex", "youtube", "zara", "zebra", "iphone", "icloud", "itunes", "sinara", "normshield", "bga", "sinaralabs", "roksit", "cybrml", "turkcell", "n11", "hepsiburada", "migros"];
const HINTS = ['banking', 'update', 'account', 'secure', 'wp', 'login', 'includes', 'admin', 'content', 'site', 'images', 'js', 'alibaba', 'css', 'myaccount', 'dropbox', 'themes', 'plugins', 'signin', 'view'];

async function extractFeaturesFromUrl(url, html) {
    // const parser = new DOMParser();
    // const doc = parser.parseFromString(html, 'text/html');
    const {doc} = parseHTML(html);
    console.log("HTML:", html);
    console.log("Parsed HTML:", doc);
    const hostname = new URL(url).hostname || '';
    const tld = hostname.includes('.') ? hostname.split('.').pop() : '';
    const path = new URL(url).pathname;
    const domain = hostname;
    const wordsRaw = url.split(/\W+/);
    const wordsRawPath = path.split(/\W+/);
    const countMatch = (pattern) => (url.match(pattern) || []).length;

    return {
        length_hostname: hostname.length,
        ip: /^https?:\/\/(\d{1,3}\.){3}\d{1,3}/.test(url) ? 1 : 0,
        nb_dots: countMatch(/\./g),
        nb_hyphens: countMatch(/-/g),
        nb_at: countMatch(/@/g),
        nb_qm: countMatch(/\?/g),
        nb_eq: countMatch(/=/g),
        nb_underscore: countMatch(/_/g),
        nb_slash: countMatch(/\//g),
        nb_www: wordsRaw.includes('www') ? 1 : 0,
        ratio_digits_url: url.replace(/[^0-9]/g, '').length / url.length,
        ratio_digits_host: hostname.replace(/[^0-9]/g, '').length / hostname.length,
        prefix_suffix: hostname.includes('-') ? 1 : 0,
        shortening_service: ['bit.ly', 'goo.gl', 'tinyurl', 'ow.ly', 't.co'].some(s => url.includes(s)) ? 1 : 0,
        length_words_raw: wordsRaw.reduce((acc, w) => acc + w.length, 0),
        shortest_word_path: Math.min(...wordsRawPath.filter(Boolean).map(w => w.length), 0),
        longest_words_raw: Math.max(...wordsRaw.filter(Boolean).map(w => w.length), 0),
        longest_word_path: Math.max(...wordsRawPath.filter(Boolean).map(w => w.length), 0),
        phish_hints: HINTS.reduce((acc, h) => acc + (url.toLowerCase().includes(h) ? 1 : 0), 0),
        domain_in_brand: ALLBRANDS.some(b => domain.toLowerCase().includes(b)) ? 1 : 0,
        suspecious_tld: ['tk', 'ml', 'ga', 'cf', 'gq'].includes(tld) ? 1 : 0,
        nb_hyperlinks: doc.querySelectorAll('a, link, script, img, form, style').length,
        ratio_extHyperlinks: (() => {
            const all = Array.from(doc.querySelectorAll('a, link, script, img, form, style'));
            const total = all.length;
            const ext = all.filter(el => {
                const href = el.getAttribute('href') || el.getAttribute('src') || '';
                return href.startsWith('http') && !href.includes(domain);
            }).length;
            return total ? ext / total : 0;
        })(),
        login_form: [...doc.querySelectorAll('form')].some(f => (f.getAttribute('action') || '').toLowerCase().includes('login')) ? 1 : 0,
        external_favicon: [...doc.querySelectorAll('link[rel*="icon"]')].some(link => {
            const href = link.getAttribute('href') || '';
            return href.startsWith('http') && !href.includes(domain);
        }) ? 1 : 0,
        links_in_tags: doc.querySelectorAll('a, link').length,
        safe_anchor: [...doc.querySelectorAll('a')].filter(a => ['#', ''].includes((a.getAttribute('href') || '').trim())).length,
        empty_title: !doc.title?.trim() ? 1 : 0,
        domain_in_title: doc.title?.toLowerCase().includes(domain.toLowerCase()) ? 1 : 0,
        domain_with_copyright: doc.body.textContent.includes('©') && doc.body.textContent.toLowerCase().includes(domain.toLowerCase()) ? 1 : 0,
        external_brand_logo: [...doc.querySelectorAll('img')].some(img => {
            const src = img.getAttribute('src') || '';
            return src.startsWith('http') && allbrand.some(b => src.includes(b));
        }) ? 1 : 0,
        suspicious_js_patterns: (() => {
            const scripts = [...doc.querySelectorAll('script')].map(s => s.textContent || '').join('');
            return ['eval(', 'escape(', 'fromCharCode', 'atob(', 'unescape('].some(k => scripts.includes(k)) ? 1 : 0;
        })(),
        url_bert_classification: (() => {
            const urlClassifier = UrlPipelineSingleton.getInstance();
            const result = urlClassifier(url);
            return result[0].label === "LABEL_1" ? 1 : 0;
        })()
    };
}


// --- Store results
function handlePhishingResults(tabId, result) {
    phishingResults[tabId] = {
        score: result.score, url: result.url, timestamp: Date.now()
    };

    console.log('[Background] Updated phishing results:', phishingResults[tabId]);

    if (result.score === 1) {
        chrome.action.setBadgeText({text: '⚠️', tabId: tabId});
        chrome.action.setBadgeBackgroundColor({color: '#FF0000', tabId: tabId});
        chrome.windows.create({
            url: chrome.runtime.getURL("phishing_warning.html"),
            type: "popup",
            width: 400,
            height: 300
        });
    } else {
        chrome.action.setBadgeText({text: '', tabId: tabId});
    }
}

// --- Send results back to content script
function sendResults(tabId, result) {
    console.log("Sending results:", result);
    chrome.tabs.sendMessage(tabId, {
        type: "detectionResult", result: JSON.stringify(result)
    });
}

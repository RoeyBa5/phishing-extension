window.addEventListener('load', () => {
    console.log("Page loaded, sending data to background script");

    chrome.runtime.sendMessage({
        type: "pageData", url: window.location.href, features: extractDOMFeatures()
    });

});

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.type === "detectionResult") {
        console.log("Detection result:", message.result);

        if (message.result.score === 1) {
            alert("Warning: This page may be a phishing site!");
        }

        const secretDiv = document.createElement('div');
        secretDiv.id = 'phishing-detector-bridge';
        secretDiv.style.display = 'none';  // Hide it
        document.body.appendChild(secretDiv);
        secretDiv.innerHTML = message.result;
    }
    ;
});

// content.js
function extractDOMFeatures() {
    const url = window.location.href;
    const hostname = location.hostname;
    const path = location.pathname;
    const domain = hostname;
    const tld = hostname.includes('.') ? hostname.split('.').pop() : '';
    const wordsRaw = url.split(/\W+/);
    const wordsRawPath = path.split(/\W+/);

    const HINTS = ['banking', 'update', 'account', 'secure', 'wp', 'login', 'includes', 'admin', 'content', 'site', 'images', 'js', 'alibaba', 'css', 'myaccount', 'dropbox', 'themes', 'plugins', 'signin', 'view'];

    const allbrand = [/* <-- paste your list of brand names here */];

    const features = {
        length_hostname: hostname.length,
        ip: /^https?:\/\/(\d{1,3}\.){3}\d{1,3}/.test(url) ? 1 : 0,
        nb_dots: (url.match(/\./g) || []).length,
        nb_hyphens: (url.match(/-/g) || []).length,
        nb_at: (url.match(/@/g) || []).length,
        nb_qm: (url.match(/\?/g) || []).length,
        nb_eq: (url.match(/=/g) || []).length,
        nb_underscore: (url.match(/_/g) || []).length,
        nb_slash: (url.match(/\//g) || []).length,
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
        domain_in_brand: allbrand.some(b => domain.toLowerCase().includes(b)) ? 1 : 0,
        suspecious_tld: ['tk', 'ml', 'ga', 'cf', 'gq'].includes(tld) ? 1 : 0,
        nb_hyperlinks: document.querySelectorAll('a, link, script, img, form, style').length,
        ratio_extHyperlinks: (() => {
            const tags = document.querySelectorAll('a, link, script, img, form, style');
            const total = tags.length;
            const ext = [...tags].filter(tag => {
                const href = tag.href || tag.src || '';
                return href.startsWith('http') && !href.includes(domain);
            }).length;
            return total > 0 ? ext / total : 0;
        })(),
        login_form: [...document.querySelectorAll('form')].some(f => (f.action || '').toLowerCase().includes('login')) ? 1 : 0,
        external_favicon: [...document.querySelectorAll('link[rel*="icon"]')].some(link => {
            const href = link.href || '';
            return href.includes('http') && !href.includes(domain);
        }) ? 1 : 0,
        links_in_tags: document.querySelectorAll('a, link').length,
        safe_anchor: [...document.querySelectorAll('a')].filter(a => ['#', ''].includes((a.getAttribute('href') || '').trim())).length,
        empty_title: !document.title?.trim() ? 1 : 0,
        domain_in_title: document.title.toLowerCase().includes(domain.toLowerCase()) ? 1 : 0,
        domain_with_copyright: document.body.innerText.includes('©') && document.body.innerText.toLowerCase().includes(domain.toLowerCase()) ? 1 : 0,
        external_brand_logo: [...document.querySelectorAll('img')].some(img => {
            const src = img.src || '';
            return src.startsWith('http') && allbrand.some(b => src.includes(b));
        }) ? 1 : 0,
        suspicious_js_patterns: (() => {
            const scripts = [...document.querySelectorAll('script')].map(s => s.innerText || '').join('');
            return ['eval(', 'escape(', 'fromCharCode', 'atob(', 'unescape('].some(k => scripts.includes(k)) ? 1 : 0;
        })()
    };

    return features;
}

const features = extractDOMFeatures();
chrome.runtime.sendMessage({type: 'features_extracted', features});


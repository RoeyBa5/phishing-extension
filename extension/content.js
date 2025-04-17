// Phishing detection logic
function detectPhishing() {
    const url = window.location.href;
    const domain = window.location.hostname;

    // Common phishing indicators
    const indicators = {
        suspiciousKeywords: ['login', 'password', 'account', 'verify', 'secure', 'bank', 'paypal'],
        suspiciousTlds: ['.xyz', '.top', '.club', '.online', '.site'],
        ipAddress: /^(?:[0-9]{1,3}\.){3}[0-9]{1,3}$/,
        shortUrl: /bit\.ly|goo\.gl|tinyurl|t\.co|ow\.ly|is\.gd|buff\.ly|adf\.ly|shorte\.st|shrink\.me/i
    };

    let score = 0;
    let warnings = [];

    // Check for suspicious keywords in URL
    indicators.suspiciousKeywords.forEach(keyword => {
        if (url.toLowerCase().includes(keyword)) {
            score += 1;
            warnings.push(`URL contains suspicious keyword: ${keyword}`);
        }
    });

    // Check for suspicious TLDs
    indicators.suspiciousTlds.forEach(tld => {
        if (domain.endsWith(tld)) {
            score += 2;
            warnings.push(`Suspicious TLD detected: ${tld}`);
        }
    });

    // Check for IP address in domain
    if (indicators.ipAddress.test(domain)) {
        score += 3;
        warnings.push('Domain is an IP address');
    }

    // Check for URL shortening services
    if (indicators.shortUrl.test(url)) {
        score += 2;
        warnings.push('URL shortening service detected');
    }

    // Check for HTTPS
    if (window.location.protocol !== 'https:') {
        score += 1;
        warnings.push('Connection is not secure (HTTP)');
    }

    // Check for form fields
    const forms = document.getElementsByTagName('form');
    if (forms.length > 0) {
        score += 1;
        warnings.push('Form detected on page');
    }

    // Send results to background script
    console.log(`[Content] Sending phishing check results: ${JSON.stringify({ score, warnings, url })}`);
    // Inside content script
    const result = {
        type: 'phishingCheck',
        score: score,
        warnings: warnings,
        url: url        
    }
    const secretDiv = document.createElement('div');
    secretDiv.id = 'phishing-detector-bridge';
    secretDiv.style.display = 'none';  // Hide it
    document.body.appendChild(secretDiv);
    secretDiv.innerHTML = JSON.stringify(result);

    chrome.runtime.sendMessage(result);

    // wait for 1 second
    setTimeout(() => {
        console.log("Phishing detection complete");
    }, 5000);
}

// Run detection when page loads
detectPhishing();

// // Also run detection when URL changes (for SPA)
// let lastUrl = location.href;
// new MutationObserver(() => {
//     const url = location.href;
//     if (url !== lastUrl) {
//         lastUrl = url;
//         detectPhishing();
//     }
// }).observe(document, { subtree: true, childList: true }); 
// Store phishing results
let phishingResults = {};

// Listen for messages from content script
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    console.log('[Background] Received message:', request);

    if (request.type === 'getResults') {
        const result = phishingResults[request.tabId];
        sendResponse({ result });
        return true; // Indicates async response
    }

    if (request.type === 'phishingCheck') {
        console.log('[Background] Processing phishing check for URL:', request.url);
        const tabId = sender.tab.id;
        phishingResults[tabId] = {
            score: request.score,
            warnings: request.warnings,
            url: request.url,
            timestamp: Date.now()
        };

        console.log('[Background] Updated phishing results:', phishingResults[tabId]);

        // Show warning if score is high
        if (request.score >= 3) {
            console.log('[Background] Setting high risk badge');
            chrome.action.setBadgeText({ text: '⚠️', tabId: tabId });
            chrome.action.setBadgeBackgroundColor({ color: '#FF0000', tabId: tabId });
        } else if (request.score > 0) {
            console.log('[Background] Setting medium risk badge');
            chrome.action.setBadgeText({ text: '!', tabId: tabId });
            chrome.action.setBadgeBackgroundColor({ color: '#FFA500', tabId: tabId });
        } else {
            console.log('[Background] Setting no risk badge');
            chrome.action.setBadgeText({ text: '', tabId: tabId });
        }
    }
});

// Clean up results when tab is closed
chrome.tabs.onRemoved.addListener((tabId) => {
    console.log('[Background] Cleaning up results for tab:', tabId);
    delete phishingResults[tabId];
});

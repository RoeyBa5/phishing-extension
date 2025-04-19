

// Run detection when page loads
// detectPhishing();

// // Also run detection when URL changes (for SPA)
// let lastUrl = location.href;
// new MutationObserver(() => {
//     const url = location.href;
//     if (url !== lastUrl) {
//         lastUrl = url;
//         detectPhishing();
//     }
// }).observe(document, { subtree: true, childList: true }); 

// on page load
window.addEventListener('load', () => {
    console.log("Page loaded, sending data to background script");
    const currentUrl = window.location.href;
    const pageContent = document.body.innerText;

    chrome.runtime.sendMessage({
        type: "pageData",
        url: currentUrl,
        content: pageContent
    });
});

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.type === "detectionResult") {
        console.log("Detection result:", message.result);

        if (message.result.label === "phishing") {
            alert("Warning: This page may be a phishing site!");
        }

        const secretDiv = document.createElement('div');
        secretDiv.id = 'phishing-detector-bridge';
        secretDiv.style.display = 'none';  // Hide it
        document.body.appendChild(secretDiv);
        secretDiv.innerHTML = message.result;
    };
});
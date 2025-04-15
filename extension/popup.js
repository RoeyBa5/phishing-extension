document.addEventListener('DOMContentLoaded', function() {
    // Get current tab
    chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
        const currentTab = tabs[0];
        const tabId = currentTab.id;
        
        // Get phishing results for current tab
        chrome.runtime.sendMessage({type: 'getResults', tabId: tabId}, function(response) {
            const statusDiv = document.getElementById('status');
            const urlDiv = document.getElementById('url');
            const warningsDiv = document.getElementById('warnings');
            
            urlDiv.textContent = currentTab.url;
            
            if (response && response.score !== undefined) {
                if (response.score >= 3) {
                    statusDiv.textContent = '⚠️ High Risk of Phishing';
                    statusDiv.className = 'status warning';
                } else if (response.score > 0) {
                    statusDiv.textContent = '⚠️ Potential Risk';
                    statusDiv.className = 'status caution';
                } else {
                    statusDiv.textContent = '✅ Safe';
                    statusDiv.className = 'status safe';
                }
                
                // Display warnings
                if (response.warnings && response.warnings.length > 0) {
                    response.warnings.forEach(warning => {
                        const warningItem = document.createElement('div');
                        warningItem.className = 'warning-item';
                        warningItem.textContent = warning;
                        warningsDiv.appendChild(warningItem);
                    });
                }
            } else {
                statusDiv.textContent = 'Analyzing...';
                statusDiv.className = 'status';
            }
        });
    });
}); 
/******/ (() => { // webpackBootstrap
/******/ 	"use strict";
/******/ 	// The require scope
/******/ 	var __webpack_require__ = {};
/******/ 	
/************************************************************************/
/******/ 	/* webpack/runtime/make namespace object */
/******/ 	(() => {
/******/ 		// define __esModule on exports
/******/ 		__webpack_require__.r = (exports) => {
/******/ 			if(typeof Symbol !== 'undefined' && Symbol.toStringTag) {
/******/ 				Object.defineProperty(exports, Symbol.toStringTag, { value: 'Module' });
/******/ 			}
/******/ 			Object.defineProperty(exports, '__esModule', { value: true });
/******/ 		};
/******/ 	})();
/******/ 	
/************************************************************************/
var __webpack_exports__ = {};
/*!**********************!*\
  !*** ./src/popup.js ***!
  \**********************/
__webpack_require__.r(__webpack_exports__);
document.addEventListener('DOMContentLoaded', function () {
    // Get current tab
    chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
        const currentTab = tabs[0];
        const tabId = currentTab.id;

        // Get phishing results for current tab
        chrome.runtime.sendMessage({ type: 'getResults', tabId: tabId }, function (response) {
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
/******/ })()
;
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicG9wdXAuanMiLCJtYXBwaW5ncyI6Ijs7VUFBQTtVQUNBOzs7OztXQ0RBO1dBQ0E7V0FDQTtXQUNBLHVEQUF1RCxpQkFBaUI7V0FDeEU7V0FDQSxnREFBZ0QsYUFBYTtXQUM3RDs7Ozs7Ozs7O0FDTkE7QUFDQTtBQUNBLHdCQUF3QixtQ0FBbUM7QUFDM0Q7QUFDQTs7QUFFQTtBQUNBLHFDQUFxQyxrQ0FBa0M7QUFDdkU7QUFDQTtBQUNBOztBQUVBOztBQUVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0Esa0JBQWtCO0FBQ2xCO0FBQ0E7QUFDQSxrQkFBa0I7QUFDbEI7QUFDQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EscUJBQXFCO0FBQ3JCO0FBQ0EsY0FBYztBQUNkO0FBQ0E7QUFDQTtBQUNBLFNBQVM7QUFDVCxLQUFLO0FBQ0wsQ0FBQyxHIiwic291cmNlcyI6WyJ3ZWJwYWNrOi8vZXh0ZW5zaW9uL3dlYnBhY2svYm9vdHN0cmFwIiwid2VicGFjazovL2V4dGVuc2lvbi93ZWJwYWNrL3J1bnRpbWUvbWFrZSBuYW1lc3BhY2Ugb2JqZWN0Iiwid2VicGFjazovL2V4dGVuc2lvbi8uL3NyYy9wb3B1cC5qcyJdLCJzb3VyY2VzQ29udGVudCI6WyIvLyBUaGUgcmVxdWlyZSBzY29wZVxudmFyIF9fd2VicGFja19yZXF1aXJlX18gPSB7fTtcblxuIiwiLy8gZGVmaW5lIF9fZXNNb2R1bGUgb24gZXhwb3J0c1xuX193ZWJwYWNrX3JlcXVpcmVfXy5yID0gKGV4cG9ydHMpID0+IHtcblx0aWYodHlwZW9mIFN5bWJvbCAhPT0gJ3VuZGVmaW5lZCcgJiYgU3ltYm9sLnRvU3RyaW5nVGFnKSB7XG5cdFx0T2JqZWN0LmRlZmluZVByb3BlcnR5KGV4cG9ydHMsIFN5bWJvbC50b1N0cmluZ1RhZywgeyB2YWx1ZTogJ01vZHVsZScgfSk7XG5cdH1cblx0T2JqZWN0LmRlZmluZVByb3BlcnR5KGV4cG9ydHMsICdfX2VzTW9kdWxlJywgeyB2YWx1ZTogdHJ1ZSB9KTtcbn07IiwiZG9jdW1lbnQuYWRkRXZlbnRMaXN0ZW5lcignRE9NQ29udGVudExvYWRlZCcsIGZ1bmN0aW9uICgpIHtcbiAgICAvLyBHZXQgY3VycmVudCB0YWJcbiAgICBjaHJvbWUudGFicy5xdWVyeSh7IGFjdGl2ZTogdHJ1ZSwgY3VycmVudFdpbmRvdzogdHJ1ZSB9LCBmdW5jdGlvbiAodGFicykge1xuICAgICAgICBjb25zdCBjdXJyZW50VGFiID0gdGFic1swXTtcbiAgICAgICAgY29uc3QgdGFiSWQgPSBjdXJyZW50VGFiLmlkO1xuXG4gICAgICAgIC8vIEdldCBwaGlzaGluZyByZXN1bHRzIGZvciBjdXJyZW50IHRhYlxuICAgICAgICBjaHJvbWUucnVudGltZS5zZW5kTWVzc2FnZSh7IHR5cGU6ICdnZXRSZXN1bHRzJywgdGFiSWQ6IHRhYklkIH0sIGZ1bmN0aW9uIChyZXNwb25zZSkge1xuICAgICAgICAgICAgY29uc3Qgc3RhdHVzRGl2ID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoJ3N0YXR1cycpO1xuICAgICAgICAgICAgY29uc3QgdXJsRGl2ID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoJ3VybCcpO1xuICAgICAgICAgICAgY29uc3Qgd2FybmluZ3NEaXYgPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZCgnd2FybmluZ3MnKTtcblxuICAgICAgICAgICAgdXJsRGl2LnRleHRDb250ZW50ID0gY3VycmVudFRhYi51cmw7XG5cbiAgICAgICAgICAgIGlmIChyZXNwb25zZSAmJiByZXNwb25zZS5zY29yZSAhPT0gdW5kZWZpbmVkKSB7XG4gICAgICAgICAgICAgICAgaWYgKHJlc3BvbnNlLnNjb3JlID49IDMpIHtcbiAgICAgICAgICAgICAgICAgICAgc3RhdHVzRGl2LnRleHRDb250ZW50ID0gJ+KaoO+4jyBIaWdoIFJpc2sgb2YgUGhpc2hpbmcnO1xuICAgICAgICAgICAgICAgICAgICBzdGF0dXNEaXYuY2xhc3NOYW1lID0gJ3N0YXR1cyB3YXJuaW5nJztcbiAgICAgICAgICAgICAgICB9IGVsc2UgaWYgKHJlc3BvbnNlLnNjb3JlID4gMCkge1xuICAgICAgICAgICAgICAgICAgICBzdGF0dXNEaXYudGV4dENvbnRlbnQgPSAn4pqg77iPIFBvdGVudGlhbCBSaXNrJztcbiAgICAgICAgICAgICAgICAgICAgc3RhdHVzRGl2LmNsYXNzTmFtZSA9ICdzdGF0dXMgY2F1dGlvbic7XG4gICAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgc3RhdHVzRGl2LnRleHRDb250ZW50ID0gJ+KchSBTYWZlJztcbiAgICAgICAgICAgICAgICAgICAgc3RhdHVzRGl2LmNsYXNzTmFtZSA9ICdzdGF0dXMgc2FmZSc7XG4gICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgLy8gRGlzcGxheSB3YXJuaW5nc1xuICAgICAgICAgICAgICAgIGlmIChyZXNwb25zZS53YXJuaW5ncyAmJiByZXNwb25zZS53YXJuaW5ncy5sZW5ndGggPiAwKSB7XG4gICAgICAgICAgICAgICAgICAgIHJlc3BvbnNlLndhcm5pbmdzLmZvckVhY2god2FybmluZyA9PiB7XG4gICAgICAgICAgICAgICAgICAgICAgICBjb25zdCB3YXJuaW5nSXRlbSA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2RpdicpO1xuICAgICAgICAgICAgICAgICAgICAgICAgd2FybmluZ0l0ZW0uY2xhc3NOYW1lID0gJ3dhcm5pbmctaXRlbSc7XG4gICAgICAgICAgICAgICAgICAgICAgICB3YXJuaW5nSXRlbS50ZXh0Q29udGVudCA9IHdhcm5pbmc7XG4gICAgICAgICAgICAgICAgICAgICAgICB3YXJuaW5nc0Rpdi5hcHBlbmRDaGlsZCh3YXJuaW5nSXRlbSk7XG4gICAgICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgc3RhdHVzRGl2LnRleHRDb250ZW50ID0gJ0FuYWx5emluZy4uLic7XG4gICAgICAgICAgICAgICAgc3RhdHVzRGl2LmNsYXNzTmFtZSA9ICdzdGF0dXMnO1xuICAgICAgICAgICAgfVxuICAgICAgICB9KTtcbiAgICB9KTtcbn0pOyAiXSwibmFtZXMiOltdLCJzb3VyY2VSb290IjoiIn0=
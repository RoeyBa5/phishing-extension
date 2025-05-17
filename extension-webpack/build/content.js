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
/*!************************!*\
  !*** ./src/content.js ***!
  \************************/
__webpack_require__.r(__webpack_exports__);
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


/******/ })()
;
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiY29udGVudC5qcyIsIm1hcHBpbmdzIjoiOztVQUFBO1VBQ0E7Ozs7O1dDREE7V0FDQTtXQUNBO1dBQ0EsdURBQXVELGlCQUFpQjtXQUN4RTtXQUNBLGdEQUFnRCxhQUFhO1dBQzdEOzs7Ozs7Ozs7QUNOQTtBQUNBOztBQUVBO0FBQ0E7QUFDQSxLQUFLOztBQUVMLENBQUM7O0FBRUQ7QUFDQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBO0FBQ0EsMkNBQTJDO0FBQzNDO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsQ0FBQzs7QUFFRDtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FBRUE7O0FBRUE7O0FBRUE7QUFDQTtBQUNBLDZCQUE2QixJQUFJLElBQUksRUFBRSxHQUFHLElBQUk7QUFDOUM7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLGFBQWE7QUFDYjtBQUNBLFNBQVM7QUFDVDtBQUNBO0FBQ0E7QUFDQTtBQUNBLFNBQVM7QUFDVDtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsU0FBUztBQUNUO0FBQ0E7QUFDQTtBQUNBLFNBQVM7QUFDVDs7QUFFQTtBQUNBOztBQUVBO0FBQ0EsNEJBQTRCLHFDQUFxQyIsInNvdXJjZXMiOlsid2VicGFjazovL2V4dGVuc2lvbi93ZWJwYWNrL2Jvb3RzdHJhcCIsIndlYnBhY2s6Ly9leHRlbnNpb24vd2VicGFjay9ydW50aW1lL21ha2UgbmFtZXNwYWNlIG9iamVjdCIsIndlYnBhY2s6Ly9leHRlbnNpb24vLi9zcmMvY29udGVudC5qcyJdLCJzb3VyY2VzQ29udGVudCI6WyIvLyBUaGUgcmVxdWlyZSBzY29wZVxudmFyIF9fd2VicGFja19yZXF1aXJlX18gPSB7fTtcblxuIiwiLy8gZGVmaW5lIF9fZXNNb2R1bGUgb24gZXhwb3J0c1xuX193ZWJwYWNrX3JlcXVpcmVfXy5yID0gKGV4cG9ydHMpID0+IHtcblx0aWYodHlwZW9mIFN5bWJvbCAhPT0gJ3VuZGVmaW5lZCcgJiYgU3ltYm9sLnRvU3RyaW5nVGFnKSB7XG5cdFx0T2JqZWN0LmRlZmluZVByb3BlcnR5KGV4cG9ydHMsIFN5bWJvbC50b1N0cmluZ1RhZywgeyB2YWx1ZTogJ01vZHVsZScgfSk7XG5cdH1cblx0T2JqZWN0LmRlZmluZVByb3BlcnR5KGV4cG9ydHMsICdfX2VzTW9kdWxlJywgeyB2YWx1ZTogdHJ1ZSB9KTtcbn07Iiwid2luZG93LmFkZEV2ZW50TGlzdGVuZXIoJ2xvYWQnLCAoKSA9PiB7XG4gICAgY29uc29sZS5sb2coXCJQYWdlIGxvYWRlZCwgc2VuZGluZyBkYXRhIHRvIGJhY2tncm91bmQgc2NyaXB0XCIpO1xuXG4gICAgY2hyb21lLnJ1bnRpbWUuc2VuZE1lc3NhZ2Uoe1xuICAgICAgICB0eXBlOiBcInBhZ2VEYXRhXCIsIHVybDogd2luZG93LmxvY2F0aW9uLmhyZWYsIGZlYXR1cmVzOiBleHRyYWN0RE9NRmVhdHVyZXMoKVxuICAgIH0pO1xuXG59KTtcblxuY2hyb21lLnJ1bnRpbWUub25NZXNzYWdlLmFkZExpc3RlbmVyKChtZXNzYWdlLCBzZW5kZXIsIHNlbmRSZXNwb25zZSkgPT4ge1xuICAgIGlmIChtZXNzYWdlLnR5cGUgPT09IFwiZGV0ZWN0aW9uUmVzdWx0XCIpIHtcbiAgICAgICAgY29uc29sZS5sb2coXCJEZXRlY3Rpb24gcmVzdWx0OlwiLCBtZXNzYWdlLnJlc3VsdCk7XG5cbiAgICAgICAgaWYgKG1lc3NhZ2UucmVzdWx0LnNjb3JlID09PSAxKSB7XG4gICAgICAgICAgICBhbGVydChcIldhcm5pbmc6IFRoaXMgcGFnZSBtYXkgYmUgYSBwaGlzaGluZyBzaXRlIVwiKTtcbiAgICAgICAgfVxuXG4gICAgICAgIGNvbnN0IHNlY3JldERpdiA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2RpdicpO1xuICAgICAgICBzZWNyZXREaXYuaWQgPSAncGhpc2hpbmctZGV0ZWN0b3ItYnJpZGdlJztcbiAgICAgICAgc2VjcmV0RGl2LnN0eWxlLmRpc3BsYXkgPSAnbm9uZSc7ICAvLyBIaWRlIGl0XG4gICAgICAgIGRvY3VtZW50LmJvZHkuYXBwZW5kQ2hpbGQoc2VjcmV0RGl2KTtcbiAgICAgICAgc2VjcmV0RGl2LmlubmVySFRNTCA9IG1lc3NhZ2UucmVzdWx0O1xuICAgIH1cbiAgICA7XG59KTtcblxuLy8gY29udGVudC5qc1xuZnVuY3Rpb24gZXh0cmFjdERPTUZlYXR1cmVzKCkge1xuICAgIGNvbnN0IHVybCA9IHdpbmRvdy5sb2NhdGlvbi5ocmVmO1xuICAgIGNvbnN0IGhvc3RuYW1lID0gbG9jYXRpb24uaG9zdG5hbWU7XG4gICAgY29uc3QgcGF0aCA9IGxvY2F0aW9uLnBhdGhuYW1lO1xuICAgIGNvbnN0IGRvbWFpbiA9IGhvc3RuYW1lO1xuICAgIGNvbnN0IHRsZCA9IGhvc3RuYW1lLmluY2x1ZGVzKCcuJykgPyBob3N0bmFtZS5zcGxpdCgnLicpLnBvcCgpIDogJyc7XG4gICAgY29uc3Qgd29yZHNSYXcgPSB1cmwuc3BsaXQoL1xcVysvKTtcbiAgICBjb25zdCB3b3Jkc1Jhd1BhdGggPSBwYXRoLnNwbGl0KC9cXFcrLyk7XG5cbiAgICBjb25zdCBISU5UUyA9IFsnYmFua2luZycsICd1cGRhdGUnLCAnYWNjb3VudCcsICdzZWN1cmUnLCAnd3AnLCAnbG9naW4nLCAnaW5jbHVkZXMnLCAnYWRtaW4nLCAnY29udGVudCcsICdzaXRlJywgJ2ltYWdlcycsICdqcycsICdhbGliYWJhJywgJ2NzcycsICdteWFjY291bnQnLCAnZHJvcGJveCcsICd0aGVtZXMnLCAncGx1Z2lucycsICdzaWduaW4nLCAndmlldyddO1xuXG4gICAgY29uc3QgYWxsYnJhbmQgPSBbLyogPC0tIHBhc3RlIHlvdXIgbGlzdCBvZiBicmFuZCBuYW1lcyBoZXJlICovXTtcblxuICAgIGNvbnN0IGZlYXR1cmVzID0ge1xuICAgICAgICBsZW5ndGhfaG9zdG5hbWU6IGhvc3RuYW1lLmxlbmd0aCxcbiAgICAgICAgaXA6IC9eaHR0cHM/OlxcL1xcLyhcXGR7MSwzfVxcLil7M31cXGR7MSwzfS8udGVzdCh1cmwpID8gMSA6IDAsXG4gICAgICAgIG5iX2RvdHM6ICh1cmwubWF0Y2goL1xcLi9nKSB8fCBbXSkubGVuZ3RoLFxuICAgICAgICBuYl9oeXBoZW5zOiAodXJsLm1hdGNoKC8tL2cpIHx8IFtdKS5sZW5ndGgsXG4gICAgICAgIG5iX2F0OiAodXJsLm1hdGNoKC9AL2cpIHx8IFtdKS5sZW5ndGgsXG4gICAgICAgIG5iX3FtOiAodXJsLm1hdGNoKC9cXD8vZykgfHwgW10pLmxlbmd0aCxcbiAgICAgICAgbmJfZXE6ICh1cmwubWF0Y2goLz0vZykgfHwgW10pLmxlbmd0aCxcbiAgICAgICAgbmJfdW5kZXJzY29yZTogKHVybC5tYXRjaCgvXy9nKSB8fCBbXSkubGVuZ3RoLFxuICAgICAgICBuYl9zbGFzaDogKHVybC5tYXRjaCgvXFwvL2cpIHx8IFtdKS5sZW5ndGgsXG4gICAgICAgIG5iX3d3dzogd29yZHNSYXcuaW5jbHVkZXMoJ3d3dycpID8gMSA6IDAsXG4gICAgICAgIHJhdGlvX2RpZ2l0c191cmw6IHVybC5yZXBsYWNlKC9bXjAtOV0vZywgJycpLmxlbmd0aCAvIHVybC5sZW5ndGgsXG4gICAgICAgIHJhdGlvX2RpZ2l0c19ob3N0OiBob3N0bmFtZS5yZXBsYWNlKC9bXjAtOV0vZywgJycpLmxlbmd0aCAvIGhvc3RuYW1lLmxlbmd0aCxcbiAgICAgICAgcHJlZml4X3N1ZmZpeDogaG9zdG5hbWUuaW5jbHVkZXMoJy0nKSA/IDEgOiAwLFxuICAgICAgICBzaG9ydGVuaW5nX3NlcnZpY2U6IFsnYml0Lmx5JywgJ2dvby5nbCcsICd0aW55dXJsJywgJ293Lmx5JywgJ3QuY28nXS5zb21lKHMgPT4gdXJsLmluY2x1ZGVzKHMpKSA/IDEgOiAwLFxuICAgICAgICBsZW5ndGhfd29yZHNfcmF3OiB3b3Jkc1Jhdy5yZWR1Y2UoKGFjYywgdykgPT4gYWNjICsgdy5sZW5ndGgsIDApLFxuICAgICAgICBzaG9ydGVzdF93b3JkX3BhdGg6IE1hdGgubWluKC4uLndvcmRzUmF3UGF0aC5maWx0ZXIoQm9vbGVhbikubWFwKHcgPT4gdy5sZW5ndGgpLCAwKSxcbiAgICAgICAgbG9uZ2VzdF93b3Jkc19yYXc6IE1hdGgubWF4KC4uLndvcmRzUmF3LmZpbHRlcihCb29sZWFuKS5tYXAodyA9PiB3Lmxlbmd0aCksIDApLFxuICAgICAgICBsb25nZXN0X3dvcmRfcGF0aDogTWF0aC5tYXgoLi4ud29yZHNSYXdQYXRoLmZpbHRlcihCb29sZWFuKS5tYXAodyA9PiB3Lmxlbmd0aCksIDApLFxuICAgICAgICBwaGlzaF9oaW50czogSElOVFMucmVkdWNlKChhY2MsIGgpID0+IGFjYyArICh1cmwudG9Mb3dlckNhc2UoKS5pbmNsdWRlcyhoKSA/IDEgOiAwKSwgMCksXG4gICAgICAgIGRvbWFpbl9pbl9icmFuZDogYWxsYnJhbmQuc29tZShiID0+IGRvbWFpbi50b0xvd2VyQ2FzZSgpLmluY2x1ZGVzKGIpKSA/IDEgOiAwLFxuICAgICAgICBzdXNwZWNpb3VzX3RsZDogWyd0aycsICdtbCcsICdnYScsICdjZicsICdncSddLmluY2x1ZGVzKHRsZCkgPyAxIDogMCxcbiAgICAgICAgbmJfaHlwZXJsaW5rczogZG9jdW1lbnQucXVlcnlTZWxlY3RvckFsbCgnYSwgbGluaywgc2NyaXB0LCBpbWcsIGZvcm0sIHN0eWxlJykubGVuZ3RoLFxuICAgICAgICByYXRpb19leHRIeXBlcmxpbmtzOiAoKCkgPT4ge1xuICAgICAgICAgICAgY29uc3QgdGFncyA9IGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3JBbGwoJ2EsIGxpbmssIHNjcmlwdCwgaW1nLCBmb3JtLCBzdHlsZScpO1xuICAgICAgICAgICAgY29uc3QgdG90YWwgPSB0YWdzLmxlbmd0aDtcbiAgICAgICAgICAgIGNvbnN0IGV4dCA9IFsuLi50YWdzXS5maWx0ZXIodGFnID0+IHtcbiAgICAgICAgICAgICAgICBjb25zdCBocmVmID0gdGFnLmhyZWYgfHwgdGFnLnNyYyB8fCAnJztcbiAgICAgICAgICAgICAgICByZXR1cm4gaHJlZi5zdGFydHNXaXRoKCdodHRwJykgJiYgIWhyZWYuaW5jbHVkZXMoZG9tYWluKTtcbiAgICAgICAgICAgIH0pLmxlbmd0aDtcbiAgICAgICAgICAgIHJldHVybiB0b3RhbCA+IDAgPyBleHQgLyB0b3RhbCA6IDA7XG4gICAgICAgIH0pKCksXG4gICAgICAgIGxvZ2luX2Zvcm06IFsuLi5kb2N1bWVudC5xdWVyeVNlbGVjdG9yQWxsKCdmb3JtJyldLnNvbWUoZiA9PiAoZi5hY3Rpb24gfHwgJycpLnRvTG93ZXJDYXNlKCkuaW5jbHVkZXMoJ2xvZ2luJykpID8gMSA6IDAsXG4gICAgICAgIGV4dGVybmFsX2Zhdmljb246IFsuLi5kb2N1bWVudC5xdWVyeVNlbGVjdG9yQWxsKCdsaW5rW3JlbCo9XCJpY29uXCJdJyldLnNvbWUobGluayA9PiB7XG4gICAgICAgICAgICBjb25zdCBocmVmID0gbGluay5ocmVmIHx8ICcnO1xuICAgICAgICAgICAgcmV0dXJuIGhyZWYuaW5jbHVkZXMoJ2h0dHAnKSAmJiAhaHJlZi5pbmNsdWRlcyhkb21haW4pO1xuICAgICAgICB9KSA/IDEgOiAwLFxuICAgICAgICBsaW5rc19pbl90YWdzOiBkb2N1bWVudC5xdWVyeVNlbGVjdG9yQWxsKCdhLCBsaW5rJykubGVuZ3RoLFxuICAgICAgICBzYWZlX2FuY2hvcjogWy4uLmRvY3VtZW50LnF1ZXJ5U2VsZWN0b3JBbGwoJ2EnKV0uZmlsdGVyKGEgPT4gWycjJywgJyddLmluY2x1ZGVzKChhLmdldEF0dHJpYnV0ZSgnaHJlZicpIHx8ICcnKS50cmltKCkpKS5sZW5ndGgsXG4gICAgICAgIGVtcHR5X3RpdGxlOiAhZG9jdW1lbnQudGl0bGU/LnRyaW0oKSA/IDEgOiAwLFxuICAgICAgICBkb21haW5faW5fdGl0bGU6IGRvY3VtZW50LnRpdGxlLnRvTG93ZXJDYXNlKCkuaW5jbHVkZXMoZG9tYWluLnRvTG93ZXJDYXNlKCkpID8gMSA6IDAsXG4gICAgICAgIGRvbWFpbl93aXRoX2NvcHlyaWdodDogZG9jdW1lbnQuYm9keS5pbm5lclRleHQuaW5jbHVkZXMoJ8KpJykgJiYgZG9jdW1lbnQuYm9keS5pbm5lclRleHQudG9Mb3dlckNhc2UoKS5pbmNsdWRlcyhkb21haW4udG9Mb3dlckNhc2UoKSkgPyAxIDogMCxcbiAgICAgICAgZXh0ZXJuYWxfYnJhbmRfbG9nbzogWy4uLmRvY3VtZW50LnF1ZXJ5U2VsZWN0b3JBbGwoJ2ltZycpXS5zb21lKGltZyA9PiB7XG4gICAgICAgICAgICBjb25zdCBzcmMgPSBpbWcuc3JjIHx8ICcnO1xuICAgICAgICAgICAgcmV0dXJuIHNyYy5zdGFydHNXaXRoKCdodHRwJykgJiYgYWxsYnJhbmQuc29tZShiID0+IHNyYy5pbmNsdWRlcyhiKSk7XG4gICAgICAgIH0pID8gMSA6IDAsXG4gICAgICAgIHN1c3BpY2lvdXNfanNfcGF0dGVybnM6ICgoKSA9PiB7XG4gICAgICAgICAgICBjb25zdCBzY3JpcHRzID0gWy4uLmRvY3VtZW50LnF1ZXJ5U2VsZWN0b3JBbGwoJ3NjcmlwdCcpXS5tYXAocyA9PiBzLmlubmVyVGV4dCB8fCAnJykuam9pbignJyk7XG4gICAgICAgICAgICByZXR1cm4gWydldmFsKCcsICdlc2NhcGUoJywgJ2Zyb21DaGFyQ29kZScsICdhdG9iKCcsICd1bmVzY2FwZSgnXS5zb21lKGsgPT4gc2NyaXB0cy5pbmNsdWRlcyhrKSkgPyAxIDogMDtcbiAgICAgICAgfSkoKVxuICAgIH07XG5cbiAgICByZXR1cm4gZmVhdHVyZXM7XG59XG5cbmNvbnN0IGZlYXR1cmVzID0gZXh0cmFjdERPTUZlYXR1cmVzKCk7XG5jaHJvbWUucnVudGltZS5zZW5kTWVzc2FnZSh7dHlwZTogJ2ZlYXR1cmVzX2V4dHJhY3RlZCcsIGZlYXR1cmVzfSk7XG5cbiJdLCJuYW1lcyI6W10sInNvdXJjZVJvb3QiOiIifQ==
import re
from pathlib import Path
from urllib.parse import urlparse
from bs4 import BeautifulSoup

def __txt_to_list(txt_object):
    list = []
    for line in txt_object:
        list.append(line.strip())
    txt_object.close()
    return list
all_brands_path = Path(__file__).parent / "allbrands.txt"
allbrand_txt = open(all_brands_path, "r")

allbrand = __txt_to_list(allbrand_txt)
HINTS = ['banking', 'update', 'account','secure','wp', 'login', 'includes', 'admin', 'content', 'site', 'images', 'js', 'alibaba', 'css', 'myaccount', 'dropbox', 'themes', 'plugins', 'signin', 'view']

def extract_features_from_url(url: str, html: str) -> dict:
    soup = BeautifulSoup(html, 'html.parser')
    parsed = urlparse(url)
    hostname = parsed.hostname or ""
    tld = hostname.split('.')[-1] if '.' in hostname else ''
    path = parsed.path
    domain = hostname
    words_raw = re.split(r'\W+', url)
    words_raw_path = re.split(r'\W+', path)

    def url_length(host): return len(host)
    def having_ip_address(u): return 1 if re.match(r'http[s]?://(\d{1,3}\.){3}\d{1,3}', u) else 0
    def count_dots(u): return u.count('.')
    def count_hyphens(u): return u.count('-')
    def count_at(u): return u.count('@')
    def count_qm(u): return u.count('?')
    def count_equal(u): return u.count('=')
    def count_underscore(u): return u.count('_')
    def count_slash(u): return u.count('/')
    def check_www(words): return 1 if 'www' in words else 0
    def ratio_digits(u): return sum(c.isdigit() for c in u) / len(u) if len(u) > 0 else 0
    def prefix_suffix(u): return 1 if '-' in (urlparse(u).hostname or "") else 0
    def shortening_service(u): return 1 if any(s in u for s in ['bit.ly', 'goo.gl', 'tinyurl', 'ow.ly', 't.co']) else 0
    def length_word_raw(words): return sum(len(w) for w in words if w)
    def shortest_word_length(words): return min((len(w) for w in words if w), default=0)
    def longest_word_length(words): return max((len(w) for w in words if w), default=0)
    def phish_hints(u): return sum(1 for h in HINTS if h in u.lower())
    def domain_in_brand(d): return 1 if any(b in d.lower() for b in allbrand) else 0
    def suspecious_tld(t): return 1 if t in ['tk', 'ml', 'ga', 'cf', 'gq'] else 0

    def nb_hyperlinks(s): return len(s.find_all(['a', 'link', 'script', 'img', 'form', 'style']))
    def ratio_external_hyperlinks(s, d):
        total = nb_hyperlinks(s)
        external = sum(1 for tag in s.find_all(['a', 'link', 'script', 'img', 'form', 'style'])
                       if (tag.get('href') or tag.get('src') or '').startswith('http') and d not in (tag.get('href') or tag.get('src') or ''))
        return external / total if total > 0 else 0
    def login_form(s): return int(any('login' in (f.get('action') or '').lower() for f in s.find_all('form')))
    def external_favicon(s, d): return int(any('http' in (l.get('href') or '') and d not in (l.get('href') or '')
                                               for l in s.find_all('link', rel=lambda x: x and 'icon' in x)))
    def links_in_tags(s): return len(s.find_all(['a', 'link']))
    def safe_anchor(s): return sum(1 for a in s.find_all('a') if a.get('href', '').strip() in ('', '#'))
    def empty_title(s): return int(s.title is None or s.title.string is None or s.title.string.strip() == '')
    def domain_in_title(d, s): return int(d.lower() in (s.title.string.lower() if s.title and s.title.string else ''))
    def domain_with_copyright(d, s): return int('©' in s.get_text() and d.lower() in s.get_text().lower())
    def external_brand_logo(s):
        for img in soup.find_all("img"):
            src = img.get("src", "")
            if src.startswith("http") and any(b in src for b in allbrand):
                return 1
        return 0
    def suspicious_js_patterns(s):
        suspicious_keywords = ["eval(", "escape(", "fromCharCode", "atob(", "unescape("]
        scripts = "".join(s.get_text() for s in s.find_all("script"))
        return int(any(k in scripts for k in suspicious_keywords))

    return {
        'length_hostname': url_length(hostname),
        'ip': having_ip_address(url),
        'nb_dots': count_dots(url),
        'nb_hyphens': count_hyphens(url),
        'nb_at': count_at(url),
        'nb_qm': count_qm(url),
        'nb_eq': count_equal(url),
        'nb_underscore': count_underscore(url),
        'nb_slash': count_slash(url),
        'nb_www': check_www(words_raw),
        'ratio_digits_url': ratio_digits(url),
        'ratio_digits_host': ratio_digits(hostname),
        'prefix_suffix': prefix_suffix(url),
        'shortening_service': shortening_service(url),
        'length_words_raw': length_word_raw(words_raw),
        'shortest_word_path': shortest_word_length(words_raw_path),
        'longest_words_raw': longest_word_length(words_raw),
        'longest_word_path': longest_word_length(words_raw_path),
        'phish_hints': phish_hints(url),
        'domain_in_brand': domain_in_brand(domain),
        'suspecious_tld': suspecious_tld(tld),
        'nb_hyperlinks': nb_hyperlinks(soup),
        'ratio_extHyperlinks': ratio_external_hyperlinks(soup, domain),
        'login_form': login_form(soup),
        'external_favicon': external_favicon(soup, domain),
        'links_in_tags': links_in_tags(soup),
        'safe_anchor': safe_anchor(soup),
        'empty_title': empty_title(soup),
        'domain_in_title': domain_in_title(domain, soup),
        'domain_with_copyright': domain_with_copyright(domain, soup),
        'external_brand_logo': external_brand_logo(soup),
        'suspicious_js_patterns': suspicious_js_patterns(soup),
    }

# Example usage
if __name__ == "__main__":
    url = "http://rgipt.ac.in"
    features = extract_features_from_url(url)
    print(features)

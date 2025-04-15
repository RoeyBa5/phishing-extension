# Phishing Detector Chrome Extension

A Chrome extension that detects potential phishing attempts and warns users about suspicious websites.

## Features

- Real-time phishing detection
- Warning system based on multiple indicators
- Visual indicators in the browser toolbar
- Detailed warnings in the popup
- Automatic detection on page load and URL changes

## Installation

1. Download or clone this repository
2. Open Chrome and go to `chrome://extensions/`
3. Enable "Developer mode" in the top right corner
4. Click "Load unpacked" and select the extension directory

## How It Works

The extension analyzes web pages for common phishing indicators:

- Suspicious keywords in URLs
- Suspicious top-level domains (TLDs)
- IP addresses in domain names
- URL shortening services
- Non-HTTPS connections
- Form fields on suspicious pages

## Warning System

- Red warning (⚠️): High risk of phishing (score ≥ 3)
- Orange warning (!): Potential risk (score > 0)
- No warning: Safe website (score = 0)

## Development

To modify the extension:

1. Edit the files in the extension directory
2. Go to `chrome://extensions/`
3. Click the refresh icon on the extension card
4. Test the changes

## Files

- `manifest.json`: Extension configuration
- `content.js`: Phishing detection logic
- `background.js`: Background processes and message handling
- `popup.html`: Popup interface
- `popup.js`: Popup functionality

## Security Note

This extension is a basic template and should be enhanced with additional security measures before production use. Consider adding:

- Machine learning-based detection
- Database of known phishing sites
- More sophisticated URL analysis
- User reporting system 
# Advanced Markdown Website Scraper

A powerful Chrome extension that converts any webpage into clean, structured Markdown format with advanced features and a beautiful modern interface.

## ✨ Features

### 🎨 Modern UI/UX
- **Beautiful Interface**: Clean, professional design with Inter font
- **Dark/Light Mode**: Complete theme support with smooth transitions
- **Real-time Feedback**: Loading states, animations, and toast notifications
- **Responsive Design**: Works perfectly on different screen sizes

### 🔧 Advanced Scraping
- **Comprehensive HTML Support**: Headers, paragraphs, blockquotes, code blocks, tables, lists, images, links
- **Smart Content Processing**: Language detection for code blocks, nested list support
- **Image Handling**: Lazy-loading detection, absolute URL conversion
- **Table Conversion**: Proper markdown table formatting with headers
- **Blockquote Support**: Clean blockquote conversion with proper formatting

### ⚙️ Customization Options
- **Selective Scraping**: Choose what content to include (images, tables, lists, code blocks)
- **Settings Persistence**: Your preferences are saved across sessions
- **Preview Mode**: Real-time markdown preview with tab switching
- **Custom Formatting**: Additional formatting options for power users

### 🚀 Enhanced Functionality
- **Context Menu Integration**: Right-click to scrape selected content
- **Keyboard Shortcuts**: 
  - `Ctrl+S` / `Cmd+S`: Scrape current page
  - `Ctrl+C` / `Cmd+C`: Copy markdown
  - `Ctrl+D` / `Cmd+D`: Download as file
  - `Escape`: Close settings panel
- **Smart Downloads**: Timestamped filenames for easy organization
- **Error Handling**: Comprehensive error catching with user-friendly messages

## 🛠️ Installation

### From Source
1. Clone or download this repository
2. Open Chrome and navigate to `chrome://extensions/`
3. Enable "Developer mode" in the top right
4. Click "Load unpacked" and select the extension folder
5. The extension will appear in your toolbar

### Files Structure
```
Web-Scrapper/
├── manifest.json          # Extension configuration
├── background.js          # Service worker for background tasks
├── popup.html            # Extension popup interface
├── popup.js              # Popup functionality and UI logic
├── content.js            # Content script for webpage scraping
├── style.css             # Modern styling with dark mode
├── icons/                # Extension icons
│   ├── icon16.png
│   ├── icon32.png
│   ├── icon48.png
│   └── icon128.png
└── README.md             # This file
```

## 🎯 Usage

### Basic Scraping
1. Navigate to any webpage you want to convert
2. Click the extension icon in your toolbar
3. Click "Scrape Current Page"
4. View the generated markdown in the textarea
5. Copy to clipboard or download as a file

### Advanced Options
1. Click the "Settings" button to open customization options
2. Toggle what content to include:
   - ✅ Include Images
   - ✅ Include Tables  
   - ✅ Include Lists
   - ✅ Include Code Blocks
   - ✅ Auto Preview
   - ✅ Custom Formatting
3. Your settings are automatically saved

### Preview Mode
1. After scraping, click the "Preview" tab
2. See how your markdown will render
3. Switch back to "Markdown" tab to edit or copy

### Theme Toggle
- Click the sun/moon icon in the header to switch between light and dark modes
- Your theme preference is saved automatically

## 🔧 Technical Details

### Permissions
- `activeTab`: Access to the current webpage for scraping
- `scripting`: Inject content scripts for advanced scraping
- `storage`: Save user preferences and settings

### Architecture
- **Manifest V3**: Uses the latest Chrome extension standards
- **Service Worker**: Efficient background processing
- **Content Scripts**: Safe webpage content extraction
- **Modern JavaScript**: ES6+ features with proper error handling
- **CSS Custom Properties**: Full theming support

### Browser Compatibility
- Chrome 88+
- Edge 88+
- Other Chromium-based browsers

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

### Development Setup
1. Clone the repository
2. Make your changes
3. Test the extension by loading it unpacked in Chrome
4. Submit a pull request

### Code Style
- Use modern JavaScript (ES6+)
- Follow the existing code structure
- Add comments for complex functionality
- Test thoroughly before submitting

## 📝 License

This project is open source and available under the [MIT License](LICENSE).

## 🐛 Bug Reports

If you encounter any issues, please report them on the GitHub issues page with:
- Steps to reproduce the problem
- Expected vs actual behavior
- Browser version and operating system
- Console error messages (if any)

## 🎉 Acknowledgments

- Built with modern web technologies
- Icons created with ImageMagick
- Styled with CSS custom properties for theming
- Uses Chrome Extension Manifest V3

---

**Made with ❤️ for the web development community** 
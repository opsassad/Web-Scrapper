// Advanced Markdown Website Scraper - Enhanced Popup Script
// Handles UI interactions, settings management, theme switching, and scraping operations

class MarkdownScraperUI {
  constructor() {
    this.settings = {
      theme: 'light',
      autoPreview: true,
      includeImages: true,
      includeTables: true,
      includeLists: true,
      includeCodeBlocks: true,
      customFormatting: false,
      exportFormat: 'markdown',
      generateTOC: false,
      addMetadata: true,
      cleanupText: true,
      skipNavigation: true,
      skipAds: true,
      skipComments: true,
      headingStyle: 'atx',
      listStyle: 'dash'
    };
    
    this.isLoading = false;
    this.currentMarkdown = '';
    this.urlHistory = [];
    this.currentMode = 'currentPage';
    
    this.init();
  }

  async init() {
    try {
      // Load settings from storage
      await this.loadSettings();
      await this.loadUrlHistory();
      
      // Initialize UI
      this.initializeElements();
      this.setupListeners();
      this.applyTheme();
      this.updateStatus('Ready to scrape', 'success');
      
      // Apply settings to checkboxes
      this.applySettings();
      
    } catch (error) {
      this.showToast('Initialization Error', error.message, 'error');
      this.logError('Initialization failed', error);
    }
  }

  initializeElements() {
    // Main elements
    this.elements = {
      // Buttons
      // Mode toggle
      currentPageMode: document.getElementById('currentPageMode'),
      urlMode: document.getElementById('urlMode'),
      currentPageSection: document.getElementById('currentPageSection'),
      urlSection: document.getElementById('urlSection'),
      
      // Main buttons
      scrapeBtn: document.getElementById('scrapeBtn'),
      scrapeUrlBtn: document.getElementById('scrapeUrlBtn'),
      bulkUrlBtn: document.getElementById('bulkUrlBtn'),
      copyBtn: document.getElementById('copyBtn'),
      downloadBtn: document.getElementById('downloadBtn'),
      clearBtn: document.getElementById('clearBtn'),
      settingsBtn: document.getElementById('settingsBtn'),
      settingsBtn2: document.getElementById('settingsBtn2'),
      closeSettings: document.getElementById('closeSettings'),
      themeToggle: document.getElementById('themeToggle'),
      
      // URL input
      urlInput: document.getElementById('urlInput'),
      urlHistoryBtn: document.getElementById('urlHistoryBtn'),
      
      // Content areas
      markdown: document.getElementById('markdown'),
      previewContent: document.getElementById('previewContent'),
      settingsPanel: document.getElementById('settingsPanel'),
      
      // Status
      statusIndicator: document.getElementById('statusIndicator'),
      statusText: document.getElementById('statusText'),
      
      // Tabs
      tabs: document.querySelectorAll('.tab'),
      tabPanes: document.querySelectorAll('.tab-pane'),
      
      // Settings checkboxes
      includeImages: document.getElementById('includeImages'),
      includeTables: document.getElementById('includeTables'),
      includeLists: document.getElementById('includeLists'),
      includeCodeBlocks: document.getElementById('includeCodeBlocks'),
      autoPreview: document.getElementById('autoPreview'),
      customFormatting: document.getElementById('customFormatting'),
      generateTOC: document.getElementById('generateTOC'),
      addMetadata: document.getElementById('addMetadata'),
      cleanupText: document.getElementById('cleanupText'),
      skipNavigation: document.getElementById('skipNavigation'),
      skipAds: document.getElementById('skipAds'),
      skipComments: document.getElementById('skipComments'),
      headingStyle: document.getElementById('headingStyle'),
      listStyle: document.getElementById('listStyle'),
      
      // Toast container
      toastContainer: document.getElementById('toastContainer')
    };
  }

  setupListeners() {
    // Mode toggle
    this.elements.currentPageMode.addEventListener('click', () => this.switchMode('currentPage'));
    this.elements.urlMode.addEventListener('click', () => this.switchMode('url'));
    
    // Main action buttons
    this.elements.scrapeBtn.addEventListener('click', () => this.handleScrape());
    this.elements.scrapeUrlBtn.addEventListener('click', () => this.handleScrapeUrl());
    this.elements.bulkUrlBtn.addEventListener('click', () => this.handleBulkUrls());
    this.elements.copyBtn.addEventListener('click', () => this.handleCopy());
    this.elements.downloadBtn.addEventListener('click', () => this.handleDownload());
    this.elements.clearBtn.addEventListener('click', () => this.handleClear());
    
    // Settings
    this.elements.settingsBtn.addEventListener('click', () => this.toggleSettings());
    this.elements.settingsBtn2.addEventListener('click', () => this.toggleSettings());
    this.elements.closeSettings.addEventListener('click', () => this.toggleSettings());
    
    // URL input
    this.elements.urlInput.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') {
        this.handleScrapeUrl();
      }
    });
    this.elements.urlHistoryBtn.addEventListener('click', () => this.showUrlHistory());
    
    // Theme toggle
    this.elements.themeToggle.addEventListener('click', () => this.toggleTheme());
    
    // Tab switching
    this.elements.tabs.forEach(tab => {
      tab.addEventListener('click', () => this.switchTab(tab.dataset.tab));
    });
    
    // Settings checkboxes and selects
    Object.keys(this.settings).forEach(key => {
      const element = this.elements[key];
      if (element) {
        if (element.type === 'checkbox') {
          element.addEventListener('change', () => this.updateSetting(key, element.checked));
        } else if (element.tagName === 'SELECT') {
          element.addEventListener('change', () => this.updateSetting(key, element.value));
        }
      }
    });
    
    // Markdown textarea changes
    this.elements.markdown.addEventListener('input', () => {
      this.currentMarkdown = this.elements.markdown.value;
      if (this.settings.autoPreview) {
        this.updatePreview();
      }
    });
    
    // Keyboard shortcuts
    document.addEventListener('keydown', (e) => this.handleKeyboardShortcuts(e));

    // Listen for final result from content script
    chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
      if (request.action === 'scraping_complete') {
        this.handleScrapingResult(request.data);
      } else if (request.action === 'scraping_failed') {
        this.handleScrapingError(request.error);
      }
    });
  }

  async loadSettings() {
    try {
      const response = await chrome.runtime.sendMessage({ action: 'getSettings' });
      if (response && response.success) {
        this.settings = { ...this.settings, ...response.settings };
      }
    } catch (error) {
      console.warn('Failed to load settings, using defaults:', error);
      // Fallback to chrome.storage.sync directly if runtime message fails
      try {
        const result = await chrome.storage.sync.get(null);
        if (result) {
          this.settings = { ...this.settings, ...result };
        }
      } catch (storageError) {
        console.warn('Direct storage access also failed:', storageError);
      }
    }
  }

  async saveSettings() {
    try {
      await chrome.runtime.sendMessage({ 
        action: 'saveSettings', 
        settings: this.settings 
      });
    } catch (error) {
      console.warn('Failed to save settings:', error);
    }
  }

  applySettings() {
    // Apply settings to checkboxes and selects
    Object.keys(this.settings).forEach(key => {
      const element = this.elements[key];
      if (element) {
        if (element.type === 'checkbox') {
          element.checked = this.settings[key];
        } else if (element.tagName === 'SELECT') {
          element.value = this.settings[key];
        }
      }
    });
  }

  updateSetting(key, value) {
    this.settings[key] = value;
    this.saveSettings();
    
    // Apply theme immediately
    if (key === 'theme') {
      this.applyTheme();
    }
  }

  applyTheme() {
    document.documentElement.setAttribute('data-theme', this.settings.theme);
  }

  toggleTheme() {
    const newTheme = this.settings.theme === 'light' ? 'dark' : 'light';
    this.updateSetting('theme', newTheme);
    this.showToast('Theme Changed', `Switched to ${newTheme} mode`, 'success');
  }

  toggleSettings() {
    this.elements.settingsPanel.classList.toggle('active');
  }

  switchTab(tabName) {
    // Update tab buttons
    this.elements.tabs.forEach(tab => {
      tab.classList.toggle('active', tab.dataset.tab === tabName);
    });
    
    // Update tab panes
    this.elements.tabPanes.forEach(pane => {
      pane.classList.toggle('active', pane.id === `${tabName}Tab`);
    });
    
    // Update preview if switching to preview tab
    if (tabName === 'preview' && this.currentMarkdown) {
      this.updatePreview();
    }
  }

  async handleScrape() {
    if (this.isLoading) return;
    
    try {
      this.setLoading(true);
      this.updateStatus('Scraping page...', 'loading');
      
      // Get current tab
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      
      if (!tab) {
        throw new Error('No active tab found');
      }

      // Check if we can access this tab
      if (tab.url.startsWith('chrome://') || tab.url.startsWith('chrome-extension://') || 
          tab.url.startsWith('edge://') || tab.url.startsWith('about:')) {
        throw new Error('Cannot scrape browser internal pages. Please navigate to a regular website.');
      }
      
      try {
        // First, test if content script is already there
        const testResponse = await chrome.tabs.sendMessage(tab.id, { action: 'ping' });
        console.log('Content script already active');
      } catch (testError) {
        console.log('Content script not found, injecting...');
        
        try {
          // Inject the content script
          await chrome.scripting.executeScript({
            target: { tabId: tab.id },
            files: ['content.js']
          });
          
          // Wait a moment for the script to initialize
          await new Promise(resolve => setTimeout(resolve, 200));
          console.log('Content script injected successfully');
          
        } catch (injectionError) {
          console.error('Failed to inject content script:', injectionError);
          throw new Error('Failed to inject content script. Please refresh the page and try again.');
        }
      }
      
      // Send message to start scraping, but don't wait for the full result
      const response = await chrome.tabs.sendMessage(tab.id, { 
        action: 'scrape_md',
        settings: this.settings
      });
      
      if (response && response.status === 'scraping_started') {
        this.updateStatus('Scraping in progress... Page is auto-scrolling.', 'loading');
        this.showToast('Scraping Started', 'The page will now be scrolled to load all content.', 'success');
      } else {
        throw new Error('Failed to initiate scraping in the content script.');
      }
      
    } catch (error) {
      let errorMessage = error.message;
      
      // Provide more specific error messages
      if (error.message.includes('Could not establish connection')) {
        errorMessage = 'Cannot connect to page. Try refreshing the page and try again.';
      } else if (error.message.includes('Cannot access')) {
        errorMessage = 'Cannot access this page. Try a regular website instead.';
      }
      
      this.updateStatus('Scraping failed', 'error');
      this.showToast('Scraping Failed', errorMessage, 'error');
      this.logError('Scraping failed', error);
      
      // Notify background script
      chrome.runtime.sendMessage({ action: 'scrapeError', error: errorMessage });
      
    } finally {
      this.setLoading(false);
    }
  }

  handleScrapingResult(data) {
    this.setLoading(false);
    this.setLoading(false, 'scrapeUrlBtn'); // Also stop URL button loading
    if (data && data.markdown) {
      let markdown = data.markdown;
      
      // Add Table of Contents if enabled
      if (this.settings.generateTOC) {
        const toc = this.generateTableOfContents(markdown);
        if (toc) {
          markdown = toc + markdown;
        }
      }
      
      this.currentMarkdown = markdown;
      this.elements.markdown.value = this.currentMarkdown;
      
      // Auto-preview if enabled
      if (this.settings.autoPreview) {
        this.updatePreview();
      }
      
      const analysis = this.analyzeContent();
      this.updateStatus(`Scraped ${analysis.wordCount} words • ${analysis.readingTime} min read`, 'success');
      this.showToast('Success!', 'Page scraped successfully', 'success');
      
      // Notify background script
      chrome.runtime.sendMessage({ action: 'scrapeComplete' });
      
    } else {
      this.handleScrapingError({ message: 'Scraping completed but no markdown was returned.' });
    }
  }

  handleScrapingError(error) {
    this.setLoading(false);
    this.setLoading(false, 'scrapeUrlBtn');
    this.updateStatus('Scraping failed', 'error');
    this.showToast('Scraping Failed', error.message || 'An unknown error occurred.', 'error');
    this.logError('Scraping failed', error);
  }

  async handleCopy() {
    if (!this.currentMarkdown) {
      this.showToast('Nothing to Copy', 'Please scrape a page first', 'warning');
      return;
    }
    
    try {
      await navigator.clipboard.writeText(this.currentMarkdown);
      this.showToast('Copied!', 'Markdown copied to clipboard', 'success');
    } catch (error) {
      // Fallback for older browsers
      this.elements.markdown.select();
      document.execCommand('copy');
      this.showToast('Copied!', 'Markdown copied to clipboard', 'success');
    }
  }

  handleDownload() {
    if (!this.currentMarkdown) {
      this.showToast('Nothing to Download', 'Please scrape a page first', 'warning');
      return;
    }
    
    // Show download options
    this.showDownloadOptions();
  }

  showDownloadOptions() {
    const modal = document.createElement('div');
    modal.className = 'download-modal';
    modal.innerHTML = `
      <div class="download-modal-content">
        <div class="download-header">
          <h3>Choose Download Format</h3>
          <button class="close-download" id="closeDownload">×</button>
        </div>
        <div class="download-options">
          <button class="download-option" data-format="markdown">
            <div class="option-icon">📝</div>
            <div class="option-info">
              <div class="option-title">Markdown (.md)</div>
              <div class="option-desc">Standard markdown format</div>
            </div>
          </button>
          <button class="download-option" data-format="html">
            <div class="option-icon">🌐</div>
            <div class="option-info">
              <div class="option-title">HTML (.html)</div>
              <div class="option-desc">Styled web page</div>
            </div>
          </button>
          <button class="download-option" data-format="txt">
            <div class="option-icon">📄</div>
            <div class="option-info">
              <div class="option-title">Plain Text (.txt)</div>
              <div class="option-desc">Clean text only</div>
            </div>
          </button>
          <button class="download-option" data-format="json">
            <div class="option-icon">🔧</div>
            <div class="option-info">
              <div class="option-title">JSON (.json)</div>
              <div class="option-desc">Structured data format</div>
            </div>
          </button>
        </div>
      </div>
    `;
    
    document.body.appendChild(modal);
    
    // Event listeners
    document.getElementById('closeDownload').addEventListener('click', () => {
      document.body.removeChild(modal);
    });
    
    modal.addEventListener('click', (e) => {
      if (e.target === modal) {
        document.body.removeChild(modal);
      }
    });
    
    document.querySelectorAll('.download-option').forEach(option => {
      option.addEventListener('click', (e) => {
        const format = e.currentTarget.dataset.format;
        this.downloadInFormat(format);
        document.body.removeChild(modal);
      });
    });
  }

  downloadInFormat(format) {
    try {
      const timestamp = new Date().toISOString().slice(0, 19).replace(/:/g, '-');
      let content, mimeType, extension;
      
      switch (format) {
        case 'markdown':
          content = this.currentMarkdown;
          mimeType = 'text/markdown';
          extension = 'md';
          break;
          
        case 'html':
          content = this.generateHTML();
          mimeType = 'text/html';
          extension = 'html';
          break;
          
        case 'txt':
          content = this.generatePlainText();
          mimeType = 'text/plain';
          extension = 'txt';
          break;
          
        case 'json':
          content = this.generateJSON();
          mimeType = 'application/json';
          extension = 'json';
          break;
          
        default:
          throw new Error('Unsupported format');
      }
      
      const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      
  a.href = url;
      a.download = `scraped-${timestamp}.${extension}`;
  a.click();
      
  URL.revokeObjectURL(url);
      this.showToast('Downloaded!', `${format.toUpperCase()} file saved`, 'success');
      
    } catch (error) {
      this.showToast('Download Failed', error.message, 'error');
      this.logError('Download failed', error);
    }
  }

  generateHTML() {
    const html = this.markdownToHtml(this.currentMarkdown);
    return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Scraped Content</title>
    <style>
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            max-width: 800px;
            margin: 0 auto;
            padding: 2rem;
            line-height: 1.6;
            color: #333;
        }
        h1, h2, h3, h4, h5, h6 { margin-top: 2rem; margin-bottom: 1rem; }
        h1 { border-bottom: 2px solid #eee; padding-bottom: 0.5rem; }
        code { background: #f5f5f5; padding: 0.2rem 0.4rem; border-radius: 3px; }
        pre { background: #f5f5f5; padding: 1rem; border-radius: 5px; overflow-x: auto; }
        blockquote { border-left: 4px solid #ddd; margin: 1rem 0; padding-left: 1rem; color: #666; }
        table { border-collapse: collapse; width: 100%; margin: 1rem 0; }
        th, td { border: 1px solid #ddd; padding: 0.5rem; text-align: left; }
        th { background: #f5f5f5; }
        img { max-width: 100%; height: auto; }
        .metadata { background: #f9f9f9; padding: 1rem; border-radius: 5px; margin-bottom: 2rem; }
    </style>
</head>
<body>
    ${html}
</body>
</html>`;
  }

  generatePlainText() {
    return this.currentMarkdown
      .replace(/#{1,6}\s/g, '') // Remove headers
      .replace(/\*\*(.*?)\*\*/g, '$1') // Remove bold
      .replace(/\*(.*?)\*/g, '$1') // Remove italic
      .replace(/`(.*?)`/g, '$1') // Remove code
      .replace(/\[([^\]]+)\]\([^\)]+\)/g, '$1') // Remove links, keep text
      .replace(/!\[[^\]]*\]\([^\)]+\)/g, '') // Remove images
      .replace(/\|.*\|/g, '') // Remove table formatting
      .replace(/^\s*[-*+]\s/gm, '• ') // Convert list markers
      .replace(/^\s*\d+\.\s/gm, '• ') // Convert numbered lists
      .replace(/\n{3,}/g, '\n\n') // Clean up extra newlines
      .trim();
  }

  generateJSON() {
    const lines = this.currentMarkdown.split('\n');
    const analysis = this.analyzeContent();
    const structure = {
      metadata: {},
      content: [],
      stats: {
        ...analysis,
        generatedAt: new Date().toISOString()
      }
    };
    
    // Extract metadata
    let inMetadata = false;
    let currentSection = null;
    
    for (const line of lines) {
      if (line.startsWith('**URL:**')) {
        structure.metadata.url = line.replace('**URL:**', '').trim();
      } else if (line.startsWith('**Scraped:**')) {
        structure.metadata.scrapedAt = line.replace('**Scraped:**', '').trim();
      } else if (line.match(/^#{1,6}\s/)) {
        const level = line.match(/^(#{1,6})/)[1].length;
        const title = line.replace(/^#{1,6}\s/, '').trim();
        currentSection = {
          type: 'heading',
          level: level,
          title: title,
          content: []
        };
        structure.content.push(currentSection);
      } else if (line.trim() && currentSection) {
        currentSection.content.push(line.trim());
      }
    }
    
    return JSON.stringify(structure, null, 2);
  }

  // Mode switching
  switchMode(mode) {
    this.currentMode = mode;
    
    // Update mode buttons
    this.elements.currentPageMode.classList.toggle('active', mode === 'currentPage');
    this.elements.urlMode.classList.toggle('active', mode === 'url');
    
    // Update sections
    this.elements.currentPageSection.classList.toggle('active', mode === 'currentPage');
    this.elements.urlSection.classList.toggle('active', mode === 'url');
    
    // Update status
    if (mode === 'url') {
      this.updateStatus('Enter URL to scrape', 'success');
    } else {
      this.updateStatus('Ready to scrape current page', 'success');
    }
  }

  // URL validation
  validateUrl(url) {
    try {
      const urlObj = new URL(url);
      return urlObj.protocol === 'http:' || urlObj.protocol === 'https:';
    } catch {
      return false;
    }
  }

  // Add URL to history
  addToUrlHistory(url) {
    if (!this.urlHistory.includes(url)) {
      this.urlHistory.unshift(url);
      // Keep only last 10 URLs
      this.urlHistory = this.urlHistory.slice(0, 10);
      this.saveUrlHistory();
    }
  }

  // Save URL history
  async saveUrlHistory() {
    try {
      await chrome.storage.local.set({ urlHistory: this.urlHistory });
    } catch (error) {
      console.warn('Failed to save URL history:', error);
    }
  }

  // Load URL history
  async loadUrlHistory() {
    try {
      const result = await chrome.storage.local.get(['urlHistory']);
      this.urlHistory = result.urlHistory || [];
    } catch (error) {
      console.warn('Failed to load URL history:', error);
    }
  }

  // Show URL history dropdown
  showUrlHistory() {
    if (this.urlHistory.length === 0) {
      this.showToast('No History', 'No recent URLs found', 'warning');
      return;
    }

    const modal = document.createElement('div');
    modal.className = 'url-history-modal';
    modal.innerHTML = `
      <div class="url-history-content">
        <div class="url-history-header">
          <h3>Recent URLs</h3>
          <button class="close-history" id="closeHistory">×</button>
        </div>
        <div class="url-history-list">
          ${this.urlHistory.map(url => `
            <button class="url-history-item" data-url="${url}">
              <div class="url-text">${url}</div>
              <div class="url-domain">${new URL(url).hostname}</div>
            </button>
          `).join('')}
        </div>
      </div>
    `;

    document.body.appendChild(modal);

    // Event listeners
    document.getElementById('closeHistory').addEventListener('click', () => {
      document.body.removeChild(modal);
    });

    modal.addEventListener('click', (e) => {
      if (e.target === modal) {
        document.body.removeChild(modal);
      }
    });

    document.querySelectorAll('.url-history-item').forEach(item => {
      item.addEventListener('click', (e) => {
        const url = e.currentTarget.dataset.url;
        this.elements.urlInput.value = url;
        document.body.removeChild(modal);
      });
    });
  }

  // Handle URL scraping
  async handleScrapeUrl() {
    const url = this.elements.urlInput.value.trim();
    
    if (!url) {
      this.showToast('URL Required', 'Please enter a URL to scrape', 'warning');
      return;
    }

    if (!this.validateUrl(url)) {
      this.showToast('Invalid URL', 'Please enter a valid HTTP or HTTPS URL', 'error');
      return;
    }

    if (this.isLoading) return;

    try {
      this.setLoading(true, 'scrapeUrlBtn');
      this.updateStatus('Opening URL and scraping...', 'loading');

      // Create a new tab with the URL
      const tab = await chrome.tabs.create({ 
        url: url, 
        active: false 
      });

      // Wait for the tab to load
      await this.waitForTabLoad(tab.id);

      // Inject content script and scrape
      await chrome.scripting.executeScript({
        target: { tabId: tab.id },
        files: ['content.js']
      });

      // Wait a moment for script initialization
      await new Promise(resolve => setTimeout(resolve, 500));

      // Send scrape message
      const response = await chrome.tabs.sendMessage(tab.id, { 
        action: 'scrape_md',
        settings: this.settings
      });

      // Close the tab
      await chrome.tabs.remove(tab.id);

      if (response && response.markdown) {
        let markdown = response.markdown;
        
        // Add Table of Contents if enabled
        if (this.settings.generateTOC) {
          const toc = this.generateTableOfContents(markdown);
          if (toc) {
            markdown = toc + markdown;
          }
        }
        
        this.currentMarkdown = markdown;
        this.elements.markdown.value = this.currentMarkdown;
        
        // Auto-preview if enabled
        if (this.settings.autoPreview) {
          this.updatePreview();
        }
        
        const analysis = this.analyzeContent();
        this.updateStatus(`Scraped ${analysis.wordCount} words • ${analysis.readingTime} min read`, 'success');
        this.showToast('Success!', 'URL scraped successfully', 'success');
        
        // Add to history
        this.addToUrlHistory(url);
        
      } else {
        throw new Error('Failed to scrape content from URL');
      }
      
    } catch (error) {
      let errorMessage = error.message;
      
      if (error.message.includes('net::')) {
        errorMessage = 'Unable to access URL. Check the URL and your internet connection.';
      } else if (error.message.includes('ERR_BLOCKED')) {
        errorMessage = 'URL blocked by browser security. Try a different URL.';
      }
      
      this.updateStatus('URL scraping failed', 'error');
      this.showToast('Scraping Failed', errorMessage, 'error');
      this.logError('URL scraping failed', error);
      
    } finally {
      this.setLoading(false, 'scrapeUrlBtn');
    }
  }

  // Wait for tab to load
  waitForTabLoad(tabId) {
    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        reject(new Error('Tab loading timeout'));
      }, 30000); // 30 second timeout

      const checkStatus = () => {
        chrome.tabs.get(tabId, (tab) => {
          if (chrome.runtime.lastError) {
            clearTimeout(timeout);
            reject(new Error(chrome.runtime.lastError.message));
            return;
          }
          
          if (tab.status === 'complete') {
            clearTimeout(timeout);
            resolve();
          } else {
            setTimeout(checkStatus, 100);
          }
        });
      };

      checkStatus();
    });
  }

  // Handle bulk URL scraping
  async handleBulkUrls() {
    const modal = document.createElement('div');
    modal.className = 'bulk-url-modal';
    modal.innerHTML = `
      <div class="bulk-url-content">
        <div class="bulk-url-header">
          <h3>Bulk URL Scraping</h3>
          <button class="close-bulk" id="closeBulk">×</button>
        </div>
        <div class="bulk-url-body">
          <textarea id="bulkUrls" placeholder="Enter URLs (one per line)&#10;https://example1.com&#10;https://example2.com&#10;https://example3.com" rows="8"></textarea>
          <div class="bulk-options">
            <label class="bulk-option">
              <input type="checkbox" id="combineResults" checked>
              <span class="checkmark"></span>
              Combine all results into one document
            </label>
            <label class="bulk-option">
              <input type="checkbox" id="addSeparators" checked>
              <span class="checkmark"></span>
              Add separators between pages
            </label>
          </div>
          <div class="bulk-actions">
            <button class="btn btn-outline" id="cancelBulk">Cancel</button>
            <button class="btn btn-primary" id="startBulk">
              <span class="btn-text">Start Scraping</span>
              <div class="btn-loading"><div class="spinner"></div></div>
            </button>
          </div>
          <div class="bulk-progress" id="bulkProgress" style="display: none;">
            <div class="progress-bar">
              <div class="progress-fill" id="progressFill"></div>
            </div>
            <div class="progress-text" id="progressText">0 / 0 completed</div>
          </div>
        </div>
      </div>
    `;

    document.body.appendChild(modal);

    // Event listeners
    document.getElementById('closeBulk').addEventListener('click', () => {
      document.body.removeChild(modal);
    });

    document.getElementById('cancelBulk').addEventListener('click', () => {
      document.body.removeChild(modal);
    });

    document.getElementById('startBulk').addEventListener('click', () => {
      this.processBulkUrls(modal);
    });

    modal.addEventListener('click', (e) => {
      if (e.target === modal) {
        document.body.removeChild(modal);
      }
    });
  }

  // Process bulk URLs
  async processBulkUrls(modal) {
    const urlsText = document.getElementById('bulkUrls').value.trim();
    const combineResults = document.getElementById('combineResults').checked;
    const addSeparators = document.getElementById('addSeparators').checked;

    if (!urlsText) {
      this.showToast('URLs Required', 'Please enter URLs to scrape', 'warning');
      return;
    }

    const urls = urlsText.split('\n')
      .map(url => url.trim())
      .filter(url => url && this.validateUrl(url));

    if (urls.length === 0) {
      this.showToast('No Valid URLs', 'Please enter valid HTTP or HTTPS URLs', 'error');
      return;
    }

    // Show progress
    const progressContainer = document.getElementById('bulkProgress');
    const progressFill = document.getElementById('progressFill');
    const progressText = document.getElementById('progressText');
    const startButton = document.getElementById('startBulk');

    progressContainer.style.display = 'block';
    startButton.classList.add('loading');

    const results = [];
    let completed = 0;

    try {
      for (const url of urls) {
        try {
          progressText.textContent = `${completed} / ${urls.length} completed - Processing: ${url}`;
          
          // Create tab and scrape
          const tab = await chrome.tabs.create({ url: url, active: false });
          await this.waitForTabLoad(tab.id);
          
          await chrome.scripting.executeScript({
            target: { tabId: tab.id },
            files: ['content.js']
          });

          await new Promise(resolve => setTimeout(resolve, 500));

          const response = await chrome.tabs.sendMessage(tab.id, { 
            action: 'scrape_md',
            settings: this.settings
          });

          await chrome.tabs.remove(tab.id);

          if (response && response.markdown) {
            results.push({
              url: url,
              markdown: response.markdown,
              timestamp: new Date().toISOString()
            });
            this.addToUrlHistory(url);
          }

        } catch (error) {
          console.warn(`Failed to scrape ${url}:`, error);
          results.push({
            url: url,
            markdown: `# Error scraping ${url}\n\n**Error:** ${error.message}\n\n---\n\n`,
            timestamp: new Date().toISOString(),
            error: true
          });
        }

        completed++;
        const progress = (completed / urls.length) * 100;
        progressFill.style.width = `${progress}%`;
        progressText.textContent = `${completed} / ${urls.length} completed`;
      }

      // Combine results
      let finalMarkdown = '';
      
      if (combineResults) {
        finalMarkdown = results.map((result, index) => {
          let content = result.markdown;
          
          if (addSeparators && index > 0) {
            content = `\n\n---\n\n# Page ${index + 1}: ${result.url}\n\n${content}`;
          } else if (index === 0) {
            content = `# Page ${index + 1}: ${result.url}\n\n${content}`;
          }
          
          return content;
        }).join('\n\n');
      } else {
        // Use first successful result
        const firstSuccess = results.find(r => !r.error);
        finalMarkdown = firstSuccess ? firstSuccess.markdown : results[0].markdown;
      }

      // Add Table of Contents if enabled
      if (this.settings.generateTOC) {
        const toc = this.generateTableOfContents(finalMarkdown);
        if (toc) {
          finalMarkdown = toc + finalMarkdown;
        }
      }

      this.currentMarkdown = finalMarkdown;
      this.elements.markdown.value = this.currentMarkdown;

      if (this.settings.autoPreview) {
        this.updatePreview();
      }

      const analysis = this.analyzeContent();
      this.updateStatus(`Bulk scraped ${urls.length} URLs • ${analysis.wordCount} words`, 'success');
      this.showToast('Bulk Scraping Complete!', `Successfully processed ${urls.length} URLs`, 'success');

      document.body.removeChild(modal);

    } catch (error) {
      this.showToast('Bulk Scraping Failed', error.message, 'error');
      this.logError('Bulk scraping failed', error);
    }
  }

  handleClear() {
    if (!this.currentMarkdown) return;
    
    if (confirm('Are you sure you want to clear the current content?')) {
      this.currentMarkdown = '';
      this.elements.markdown.value = '';
      this.elements.previewContent.innerHTML = `
        <div class="preview-placeholder">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
            <circle cx="12" cy="12" r="3"/>
          </svg>
          <p>Preview will appear here after scraping</p>
        </div>
      `;
      this.updateStatus('Ready to scrape', 'success');
      this.showToast('Cleared', 'Content cleared successfully', 'success');
    }
  }

  updatePreview() {
    if (!this.currentMarkdown) return;
    
    try {
      // Simple markdown to HTML conversion (basic implementation)
      let html = this.markdownToHtml(this.currentMarkdown);
      this.elements.previewContent.innerHTML = html;
    } catch (error) {
      this.elements.previewContent.innerHTML = `
        <div class="preview-placeholder">
          <p style="color: var(--error);">Preview error: ${error.message}</p>
        </div>
      `;
    }
  }

  markdownToHtml(markdown) {
    // Basic markdown to HTML conversion with better safety
    try {
      return markdown
        .replace(/^# (.*$)/gim, '<h1>$1</h1>')
        .replace(/^## (.*$)/gim, '<h2>$1</h2>')
        .replace(/^### (.*$)/gim, '<h3>$1</h3>')
        .replace(/^#### (.*$)/gim, '<h4>$1</h4>')
        .replace(/^##### (.*$)/gim, '<h5>$1</h5>')
        .replace(/^###### (.*$)/gim, '<h6>$1</h6>')
        .replace(/\*\*(.*?)\*\*/gim, '<strong>$1</strong>')
        .replace(/\*(.*?)\*/gim, '<em>$1</em>')
        .replace(/`(.*?)`/gim, '<code>$1</code>')
        .replace(/\n\n/gim, '</p><p>')
        .replace(/\n/gim, '<br>')
        .replace(/^(.*)$/gim, '<p>$1</p>')
        .replace(/<p><\/p>/gim, '')
        .replace(/<p>(<h[1-6]>.*<\/h[1-6]>)<\/p>/gim, '$1')
        .replace(/<p>(<table>.*<\/table>)<\/p>/gims, '$1');
    } catch (error) {
      console.error('Markdown to HTML conversion error:', error);
      return '<p>Preview error: Unable to convert markdown</p>';
    }
  }

  setLoading(loading, buttonId = 'scrapeBtn') {
    this.isLoading = loading;
    if (this.elements[buttonId]) {
      this.elements[buttonId].classList.toggle('loading', loading);
      this.elements[buttonId].disabled = loading;
    }
  }

  updateStatus(text, type = 'success') {
    this.elements.statusText.textContent = text;
    this.elements.statusIndicator.className = `status-indicator ${type}`;
  }

  getWordCount() {
    return this.currentMarkdown.split(/\s+/).filter(word => word.length > 0).length;
  }

  analyzeContent() {
    const wordCount = this.getWordCount();
    const charCount = this.currentMarkdown.length;
    const readingTime = Math.ceil(wordCount / 200); // Average reading speed
    
    // Extract headings for TOC
    const headings = [];
    const lines = this.currentMarkdown.split('\n');
    for (const line of lines) {
      const match = line.match(/^(#{1,6})\s(.+)/);
      if (match) {
        headings.push({
          level: match[1].length,
          text: match[2].trim()
        });
      }
    }
    
    // Count different elements
    const stats = {
      wordCount,
      charCount,
      readingTime,
      headings: headings.length,
      paragraphs: (this.currentMarkdown.match(/\n\n/g) || []).length,
      lists: (this.currentMarkdown.match(/^\s*[-*+]\s/gm) || []).length,
      tables: (this.currentMarkdown.match(/\|.*\|/g) || []).length,
      images: (this.currentMarkdown.match(/!\[.*\]\(.*\)/g) || []).length,
      links: (this.currentMarkdown.match(/\[.*\]\(.*\)/g) || []).length,
      codeBlocks: (this.currentMarkdown.match(/```[\s\S]*?```/g) || []).length
    };
    
    return stats;
  }

  generateTableOfContents(markdown = this.currentMarkdown) {
    const headings = [];
    const lines = markdown.split('\n');
    
    for (const line of lines) {
      const match = line.match(/^(#{1,6})\s(.+)/);
      if (match) {
        const level = match[1].length;
        const text = match[2].trim();
        const indent = '  '.repeat(level - 1);
        headings.push(`${indent}- ${text}`);
      }
    }
    
    if (headings.length === 0) return '';
    
    return `\n## Table of Contents\n\n${headings.join('\n')}\n\n---\n\n`;
  }

  showToast(title, message, type = 'success') {
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    
    const icons = {
      success: `<path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22,4 12,14.01 9,11.01"></polyline>`,
      error: `<circle cx="12" cy="12" r="10"></circle><line x1="15" y1="9" x2="9" y2="15"></line><line x1="9" y1="9" x2="15" y2="15"></line>`,
      warning: `<path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path><line x1="12" y1="9" x2="12" y2="13"></line><line x1="12" y1="17" x2="12.01" y2="17"></line>`
    };
    
    toast.innerHTML = `
      <svg class="toast-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        ${icons[type]}
      </svg>
      <div class="toast-content">
        <div class="toast-title">${title}</div>
        <div class="toast-message">${message}</div>
      </div>
    `;
    
    this.elements.toastContainer.appendChild(toast);
    
    // Auto remove after 5 seconds
    setTimeout(() => {
      if (toast.parentNode) {
        toast.parentNode.removeChild(toast);
      }
    }, 5000);
  }

  handleKeyboardShortcuts(e) {
    // Ctrl/Cmd + S: Scrape
    if ((e.ctrlKey || e.metaKey) && e.key === 's') {
      e.preventDefault();
      this.handleScrape();
    }
    
    // Ctrl/Cmd + C: Copy (when not in textarea)
    if ((e.ctrlKey || e.metaKey) && e.key === 'c' && e.target !== this.elements.markdown) {
      e.preventDefault();
      this.handleCopy();
    }
    
    // Ctrl/Cmd + D: Download
    if ((e.ctrlKey || e.metaKey) && e.key === 'd') {
      e.preventDefault();
      this.handleDownload();
    }
    
    // Escape: Close settings
    if (e.key === 'Escape') {
      if (this.elements.settingsPanel.classList.contains('active')) {
        this.toggleSettings();
      }
    }
  }

  logError(context, error) {
    const errorInfo = {
      context,
      message: error.message,
      stack: error.stack,
      timestamp: new Date().toISOString(),
      url: window.location.href
    };
    
    chrome.runtime.sendMessage({ 
      action: 'logError', 
      error: errorInfo 
    });
  }
}

// Initialize the app when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  new MarkdownScraperUI();
});

// Handle extension context invalidation
chrome.runtime.onConnect.addListener(() => {
  // Extension context is still valid
});

// Export for potential testing
if (typeof module !== 'undefined' && module.exports) {
  module.exports = MarkdownScraperUI;
}

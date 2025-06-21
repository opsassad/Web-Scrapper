// Background Service Worker for Advanced Markdown Website Scraper
// Handles extension lifecycle, storage management, and cross-tab communication

// Install event - set up initial state
chrome.runtime.onInstalled.addListener((details) => {
  console.log('Advanced Markdown Scraper installed:', details.reason);
  
  try {
    // Set default settings
    chrome.storage.sync.set({
      theme: 'light',
      autoPreview: true,
      includeImages: true,
      includeTables: true,
      includeLists: true,
      includeCodeBlocks: true,
      customFormatting: false,
      exportFormat: 'markdown'
    });

    // Show welcome notification for new installs
    if (details.reason === 'install') {
      chrome.action.setBadgeText({ text: 'NEW' });
      chrome.action.setBadgeBackgroundColor({ color: '#4CAF50' });
      
      // Clear badge after 5 seconds
      setTimeout(() => {
        chrome.action.setBadgeText({ text: '' });
      }, 5000);
    }

    // Create context menu
    chrome.contextMenus.create({
      id: 'scrapeToMarkdown',
      title: 'Scrape to Markdown',
      contexts: ['page', 'selection']
    });

  } catch (error) {
    console.error('Installation error:', error);
  }
});

// Handle extension startup
chrome.runtime.onStartup.addListener(() => {
  console.log('Advanced Markdown Scraper started');
});

// Handle messages from content scripts and popup
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  try {
    switch (request.action) {
      case 'getSettings':
        chrome.storage.sync.get(null, (settings) => {
          sendResponse({ success: true, settings });
        });
        return true; // Keep message channel open for async response

      case 'saveSettings':
        chrome.storage.sync.set(request.settings, () => {
          sendResponse({ success: true });
        });
        return true;

      case 'scrapeComplete':
        // Update badge to show successful scrape
        chrome.action.setBadgeText({ text: '✓' });
        chrome.action.setBadgeBackgroundColor({ color: '#4CAF50' });
        
        // Clear badge after 3 seconds
        setTimeout(() => {
          chrome.action.setBadgeText({ text: '' });
        }, 3000);
        break;

      case 'scrapeError':
        // Update badge to show error
        chrome.action.setBadgeText({ text: '✗' });
        chrome.action.setBadgeBackgroundColor({ color: '#f44336' });
        
        // Clear badge after 3 seconds
        setTimeout(() => {
          chrome.action.setBadgeText({ text: '' });
        }, 3000);
        break;

      case 'logError':
        console.error('Extension Error (' + (request.error.context || 'general') + '):', request.error.message, request.error.stack);
        break;

      default:
        console.log('Unknown message action:', request.action);
    }
  } catch (error) {
    console.error('Message handling error:', error);
    sendResponse({ success: false, error: error.message });
  }
});

// Handle tab updates to reset badge
chrome.tabs.onActivated.addListener(() => {
  try {
    chrome.action.setBadgeText({ text: '' });
  } catch (error) {
    console.error('Tab activation error:', error);
  }
});

// Handle context menu clicks
chrome.contextMenus.onClicked.addListener((info, tab) => {
  try {
    if (info.menuItemId === 'scrapeToMarkdown') {
      // Send message to content script to scrape
      chrome.tabs.sendMessage(tab.id, { 
        action: 'scrape_md',
        selectionOnly: info.selectionText ? true : false,
        selectedText: info.selectionText || '',
        settings: {} // Will be populated by content script
      });
    }
  } catch (error) {
    console.error('Context menu error:', error);
  }
});

// Error handling
chrome.runtime.onSuspend.addListener(() => {
  console.log('Advanced Markdown Scraper suspended');
});

// Keep service worker alive with periodic tasks
const keepAlive = () => {
  try {
    chrome.storage.local.set({ lastKeepAlive: Date.now() });
  } catch (error) {
    console.error('Keep alive error:', error);
  }
};

// Run keepAlive every 25 seconds
setInterval(keepAlive, 25000);
keepAlive(); // Initial call 
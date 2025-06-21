// Advanced Markdown Website Scraper - Enhanced Content Script
// Handles webpage content extraction with comprehensive HTML element support

class AdvancedMarkdownScraper {
  constructor() {
    this.settings = {
      includeImages: true,
      includeTables: true,
      includeLists: true,
      includeCodeBlocks: true,
      customFormatting: false
    };
  }

  // Enhanced markdown escaping
  escapeMarkdown(text) {
    if (!text) return '';
    return text
      .replace(/\\/g, '\\\\')
      .replace(/\*/g, '\\*')
      .replace(/_/g, '\\_')
      .replace(/`/g, '\\`')
      .replace(/~/g, '\\~')
      .replace(/\[/g, '\\[')
      .replace(/\]/g, '\\]')
      .replace(/\(/g, '\\(')
      .replace(/\)/g, '\\)')
      .replace(/>/g, '\\>')
      .replace(/#/g, '\\#')
      .replace(/\+/g, '\\+')
      .replace(/-/g, '\\-')
      .replace(/\./g, '\\.')
      .replace(/!/g, '\\!')
      .replace(/\|/g, '\\|');
  }

  // Clean and normalize text
  cleanText(text) {
    if (!text) return '';
    return text
      .replace(/\s+/g, ' ')
      .replace(/\n+/g, ' ')
      .trim();
  }

  // Safely get element classes as a lowercase string
  getElementClasses(element) {
    try {
      if (!element || !element.className) {
        return '';
      }
      
      // Handle both string and DOMTokenList cases
      if (typeof element.className === 'string') {
        return element.className.toLowerCase();
      } else if (element.className.toString) {
        return element.className.toString().toLowerCase();
      } else {
        return '';
      }
    } catch (error) {
      console.warn('Error getting element classes:', error);
      return '';
    }
  }

  // Enhanced table conversion with better formatting
  tableToMarkdown(table) {
    try {
    const rows = Array.from(table.rows);
      if (rows.length === 0) return '';

      // Handle header row
      const headerRow = rows[0];
      const headers = Array.from(headerRow.cells).map(cell => 
        this.cleanText(cell.innerText || cell.textContent || '')
      );

      if (headers.length === 0) return '';

      // Handle data rows
      const dataRows = rows.slice(1).map(row =>
        Array.from(row.cells).map(cell => 
          this.cleanText(cell.innerText || cell.textContent || '')
        )
      );

      // Build markdown table
      const headerLine = '| ' + headers.join(' | ') + ' |';
      const separatorLine = '| ' + headers.map(() => '---').join(' | ') + ' |';
      const dataLines = dataRows.map(row => 
        '| ' + row.join(' | ') + ' |'
      );

      return '\n' + [headerLine, separatorLine, ...dataLines].join('\n') + '\n';

    } catch (error) {
      console.warn('Table conversion error:', error);
      return '\n[Table conversion failed]\n';
    }
  }

  // Convert lists with proper nesting
  listToMarkdown(list, ordered = false, depth = 0) {
    try {
      const items = Array.from(list.children).filter(item => 
        item.tagName.toLowerCase() === 'li'
      );

      const indent = '  '.repeat(depth);
      const prefix = ordered ? '1. ' : '- ';

      return items.map((item, index) => {
        let text = '';
        let content = '';

        // Process child nodes
        for (const node of item.childNodes) {
          if (node.nodeType === Node.TEXT_NODE) {
            content += node.textContent;
          } else if (node.nodeType === Node.ELEMENT_NODE) {
            const tagName = node.tagName.toLowerCase();
            if (tagName === 'ul') {
              text += '\n' + this.listToMarkdown(node, false, depth + 1);
            } else if (tagName === 'ol') {
              text += '\n' + this.listToMarkdown(node, true, depth + 1);
            } else {
              content += node.innerText || node.textContent || '';
            }
          }
        }

        const actualPrefix = ordered ? `${index + 1}. ` : '- ';
        return indent + actualPrefix + this.cleanText(content) + text;
      }).join('\n');

    } catch (error) {
      console.warn('List conversion error:', error);
      return '\n[List conversion failed]\n';
    }
  }

  // Enhanced code block handling
  codeBlockToMarkdown(element) {
    try {
      const language = this.detectCodeLanguage(element);
      const code = element.innerText || element.textContent || '';
      
      if (language) {
        return `\n\`\`\`${language}\n${code}\n\`\`\`\n`;
      } else {
        return `\n\`\`\`\n${code}\n\`\`\`\n`;
      }
    } catch (error) {
      console.warn('Code block conversion error:', error);
      return `\n\`\`\`\n${element.innerText || ''}\n\`\`\`\n`;
    }
  }

  // Detect code language from class names or other hints
  detectCodeLanguage(element) {
    const classNames = this.getElementClasses(element);
    const languages = [
      'javascript', 'js', 'typescript', 'ts', 'python', 'py', 'java',
      'cpp', 'c++', 'c', 'csharp', 'c#', 'php', 'ruby', 'go', 'rust',
      'html', 'css', 'scss', 'sass', 'json', 'xml', 'yaml', 'yml',
      'bash', 'shell', 'sh', 'sql', 'markdown', 'md'
    ];

    for (const lang of languages) {
      if (classNames.includes(lang) || classNames.includes(`language-${lang}`)) {
        return lang;
      }
    }

    return '';
  }

  // Handle blockquotes
  blockquoteToMarkdown(element) {
    try {
      const text = this.cleanText(element.innerText || element.textContent || '');
      return text.split('\n').map(line => `> ${line}`).join('\n') + '\n';
    } catch (error) {
      console.warn('Blockquote conversion error:', error);
      return `> [Blockquote conversion failed]\n`;
    }
  }

  // Handle images with better attribute detection
  imageToMarkdown(img) {
    try {
      if (!this.settings.includeImages) return '';

      const src = img.src || img.getAttribute('data-src') || img.getAttribute('data-lazy-src') || '';
      const alt = img.alt || img.getAttribute('title') || '';
      const title = img.title || '';

      if (!src) return '';

      // Convert relative URLs to absolute
      const absoluteSrc = new URL(src, window.location.href).href;

      if (title) {
        return `\n![${alt}](${absoluteSrc} "${title}")\n`;
      } else {
        return `\n![${alt}](${absoluteSrc})\n`;
      }
    } catch (error) {
      console.warn('Image conversion error:', error);
      return '\n[Image conversion failed]\n';
    }
  }

  // Handle links
  linkToMarkdown(link) {
    try {
      const href = link.href || '';
      const text = this.cleanText(link.innerText || link.textContent || '');
      const title = link.title || '';

      if (!href || href === text) {
        return text;
      }

      if (title) {
        return `[${text}](${href} "${title}")`;
      } else {
        return `[${text}](${href})`;
      }
    } catch (error) {
      console.warn('Link conversion error:', error);
      return link.innerText || link.textContent || '';
    }
  }

  // Main scraping function with enhanced element support
  async scrapeMarkdown(settings = {}) {
    try {
      // Update settings
      this.settings = { ...this.settings, ...settings };

      let markdown = `# ${document.title || 'Untitled Page'}\n\n`;

      // Add page metadata
      const url = window.location.href;
      const timestamp = new Date().toISOString();
      markdown += `**URL:** ${url}\n`;
      markdown += `**Scraped:** ${timestamp}\n\n---\n\n`;

      // Special handling for Reddit
      if (window.location.hostname.includes('reddit.com')) {
        return await this.scrapeRedditContent(markdown);
      }

      // Find the main content area (avoid navigation, headers, footers, sidebars)
      const mainContent = this.findMainContent();
      
      if (!mainContent) {
        // Fallback to body if no main content found
        console.log('No main content found, using document.body as fallback');
        return this.scrapeFromElement(document.body, markdown);
      }

      console.log('Found main content:', mainContent.tagName, this.getElementClasses(mainContent));
      // Process the main content area
      return this.scrapeFromElement(mainContent, markdown);

    } catch (error) {
      console.error('Scraping error:', error);
      return `# Scraping Error\n\nAn error occurred while scraping this page: ${error.message}\n\nContext: ${error.stack}\n\nPlease try again or report this issue.`;
    }
  }

  // Special Reddit content scraping
  async scrapeRedditContent(markdown) {
    try {
      console.log('Starting Smart Scrolling for Reddit...');
      await this.autoScrollPage();
      console.log('Smart Scrolling complete. Scraping Reddit content...');

      // Get the main post content
      const postContent = this.extractRedditPost();
      if (postContent) {
        markdown += postContent;
      }

      // Get comments
      const comments = this.extractRedditComments();
      if (comments) {
        markdown += '\n\n## Comments\n\n';
        markdown += comments;
      }

      return this.cleanupMarkdown(markdown);

    } catch (error) {
      console.error('Reddit scraping error:', error);
      // Fallback to regular scraping
      const mainContent = this.findMainContent();
      if (mainContent) {
        return this.scrapeFromElement(mainContent, markdown);
      }
      return this.scrapeFromElement(document.body, markdown);
    }
  }

  // Extract Reddit post content
  extractRedditPost() {
    let postMarkdown = '';

    // Try different selectors for post content
    const postSelectors = [
      '[data-testid="post-container"]',
      '.Post',
      '[data-click-id="body"]',
      '.thing.link',
      'shreddit-post',
      // Additional fallback selectors
      'article',
      '[role="article"]',
      '.content[role="main"]'
    ];

    let postElement = null;
    for (const selector of postSelectors) {
      postElement = document.querySelector(selector);
      if (postElement) {
        console.log(`Found post using selector: ${selector}`);
          break;
      }
    }

    if (!postElement) {
      console.log('No post element found, trying fallback extraction');
      return this.extractRedditPostFallback();
    }

    // Extract post title
    const titleSelectors = [
      '[data-testid="post-content"] h1',
      '.Post h3',
      '[data-click-id="body"] h3',
      'h1[slot="title"]',
      '.title a',
      'shreddit-post h1'
    ];

    for (const selector of titleSelectors) {
      const titleElement = postElement.querySelector(selector);
      if (titleElement) {
        const title = this.cleanText(titleElement.innerText || titleElement.textContent || '');
        if (title) {
          postMarkdown += `## ${title}\n\n`;
          console.log('Found post title:', title);
          break;
        }
      }
    }

    // Extract post body/text content
    const bodySelectors = [
      '[data-testid="post-content"] [data-click-id="text"]',
      '.Post [data-click-id="text"]',
      '.usertext-body .md',
      '[slot="text-body"]',
      '.expando .usertext-body',
      'shreddit-post [slot="text-body"]',
      '.Post .RichTextJSON-root'
    ];

    for (const selector of bodySelectors) {
      const bodyElement = postElement.querySelector(selector);
      if (bodyElement) {
        const bodyText = this.cleanText(bodyElement.innerText || bodyElement.textContent || '');
        if (bodyText && bodyText.length > 10) {
          postMarkdown += `${bodyText}\n\n`;
          console.log('Found post body, length:', bodyText.length);
          break;
        }
      }
    }

    // Extract post metadata
    const metaSelectors = [
      '[data-testid="post-content"] [data-click-id="timestamp"]',
      '.Post time',
      '.tagline time',
      'shreddit-post time'
    ];

    for (const selector of metaSelectors) {
      const metaElement = postElement.querySelector(selector);
      if (metaElement) {
        const metaText = this.cleanText(metaElement.innerText || metaElement.textContent || '');
        if (metaText) {
          postMarkdown += `*Posted: ${metaText}*\n\n`;
          break;
        }
      }
    }

    return postMarkdown;
  }

  // Extract Reddit comments
  extractRedditComments() {
    let commentsMarkdown = '';

    // Try different selectors for comments
    const commentSelectors = [
      '[data-testid="comment"]',
      '.Comment',
      '.comment',
      '.commentarea .thing',
      'shreddit-comment'
    ];

    let comments = [];
    for (const selector of commentSelectors) {
      comments = document.querySelectorAll(selector);
      if (comments.length > 0) {
        console.log(`Found ${comments.length} comments using selector: ${selector}`);
          break;
      }
    }

    if (comments.length === 0) {
      console.log('No comments found with specific selectors, trying fallback');
      return this.extractRedditCommentsFallback();
    }

    // Process each comment
    Array.from(comments).slice(0, 20).forEach((comment, index) => { // Limit to first 20 comments
      const commentText = this.extractSingleComment(comment, index + 1);
      if (commentText) {
        commentsMarkdown += commentText + '\n\n';
      }
    });

    return commentsMarkdown;
  }

  // Extract a single comment
  extractSingleComment(commentElement, index) {
    let commentMarkdown = '';

    // Extract comment author
    const authorSelectors = [
      '[data-testid="comment_author_link"]',
      '.Comment__author',
      '.author',
      'shreddit-comment [slot="author"]'
    ];

    let author = '';
    for (const selector of authorSelectors) {
      const authorElement = commentElement.querySelector(selector);
      if (authorElement) {
        author = this.cleanText(authorElement.innerText || authorElement.textContent || '');
        if (author) break;
      }
    }

    // Extract comment body
    const bodySelectors = [
      '[data-testid="comment"] [data-click-id="text"]',
      '.Comment__body',
      '.usertext-body .md',
      'shreddit-comment [slot="comment"]',
      '.comment .usertext-body'
    ];

    let body = '';
    for (const selector of bodySelectors) {
      const bodyElement = commentElement.querySelector(selector);
      if (bodyElement) {
        body = this.cleanText(bodyElement.innerText || bodyElement.textContent || '');
        if (body && body.length > 5) break;
      }
    }

    if (body) {
      commentMarkdown += `### Comment ${index}`;
      if (author) {
        commentMarkdown += ` by ${author}`;
      }
      commentMarkdown += `\n\n${body}\n\n---`;
    }

    return commentMarkdown;
  }

  // Fallback Reddit post extraction using text analysis
  extractRedditPostFallback() {
    console.log('Using fallback Reddit extraction...');
    let postMarkdown = '';

    // Try to find post content by looking for large text blocks
    const textElements = document.querySelectorAll('p, div, span');
    const textBlocks = [];

    textElements.forEach(element => {
      const text = this.cleanText(element.innerText || element.textContent || '');
      if (text.length > 50 && !this.shouldSkipElement(element)) {
        textBlocks.push({
          element: element,
          text: text,
          length: text.length
        });
      }
    });

    // Sort by text length and take the longest ones
    textBlocks.sort((a, b) => b.length - a.length);

    // Extract the main post content (usually the longest text block)
    if (textBlocks.length > 0) {
      const mainText = textBlocks[0].text;
      if (mainText.length > 100) {
        postMarkdown += `## Post Content\n\n${mainText}\n\n`;
      }

      // Add additional text blocks if they seem relevant
      for (let i = 1; i < Math.min(3, textBlocks.length); i++) {
        const block = textBlocks[i];
        if (block.length > 100 && block.length > mainText.length * 0.3) {
          postMarkdown += `${block.text}\n\n`;
        }
      }
    }

    return postMarkdown;
  }

  // Fallback comment extraction
  extractRedditCommentsFallback() {
    console.log('Using fallback comment extraction...');
    let commentsMarkdown = '';

    // Look for elements that might contain comments
    const possibleComments = document.querySelectorAll('div, p, article');
    const commentCandidates = [];

    possibleComments.forEach(element => {
      const text = this.cleanText(element.innerText || element.textContent || '');
      const classes = this.getElementClasses(element);
      
      // Skip if it looks like navigation or UI
      if (this.shouldSkipElement(element)) return;
      
      // Look for comment-like characteristics
      if (text.length > 20 && text.length < 1000) {
        // Check if it might be a comment based on structure or classes
        if (classes.includes('comment') || 
            classes.includes('reply') ||
            element.querySelector('time') || // Has timestamp
            text.match(/^\w+\s+\d+\s+(hour|minute|day|week|month|year)s?\s+ago/i)) { // Looks like "username 2 hours ago"
          
          commentCandidates.push({
            element: element,
            text: text,
            score: this.calculateCommentScore(element, text)
          });
        }
      }
    });

    // Sort by score and take the best candidates
    commentCandidates.sort((a, b) => b.score - a.score);

    // Extract top comment candidates
    commentCandidates.slice(0, 10).forEach((candidate, index) => {
      commentsMarkdown += `### Comment ${index + 1}\n\n${candidate.text}\n\n---\n\n`;
    });

    return commentsMarkdown;
  }

  // Calculate a score for how likely an element is to be a comment
  calculateCommentScore(element, text) {
    let score = 0;
    const classes = this.getElementClasses(element);
    
    // Positive indicators
    if (classes.includes('comment')) score += 10;
    if (classes.includes('reply')) score += 8;
    if (element.querySelector('time')) score += 5;
    if (text.match(/^\w+\s+\d+\s+(hour|minute|day|week|month|year)s?\s+ago/i)) score += 7;
    if (text.length > 50 && text.length < 500) score += 3;
    
    // Negative indicators
    if (classes.includes('nav')) score -= 10;
    if (classes.includes('header')) score -= 10;
    if (classes.includes('footer')) score -= 10;
    if (classes.includes('ad')) score -= 15;
    
    return score;
  }

  // New Smart Scrolling functionality
  async autoScrollPage() {
    const scrollCount = 5; // How many times to scroll down
    const scrollDelay = 1500; // ms to wait after each scroll for content to load
    let lastHeight = 0;
    let stableCount = 0;

    console.log(`Starting auto-scroll, will scroll up to ${scrollCount} times.`);

    for (let i = 0; i < scrollCount; i++) {
      const currentHeight = document.body.scrollHeight;
      window.scrollTo(0, currentHeight);
      
      console.log(`Scroll ${i + 1}/${scrollCount}, height: ${currentHeight}`);

      // Wait for content to load
      await new Promise(resolve => setTimeout(resolve, scrollDelay));

      // Click "load more comments" or "continue thread" buttons
      const loadMoreSelectors = [
        '.CommentTree__load-more-button', 
        '[data-testid="load-more-comments-button"]', 
        'shreddit-comment-tree [kind="more-comments"] button',
        'faceplate-partial[src*="/more-comments/"]'
      ];
      
      let clickedButton = false;
      for (const selector of loadMoreSelectors) {
        const loadMoreButtons = document.querySelectorAll(selector);
        loadMoreButtons.forEach(button => {
          if (this.isElementInViewport(button)) {
            console.log('Found and clicked "load more" button:', button);
            button.click();
            clickedButton = true;
          }
        });
      }

      // If we clicked a button, wait again for the new comments to load
      if (clickedButton) {
        await new Promise(resolve => setTimeout(resolve, scrollDelay));
      }

      // Check if the page height has stopped changing
      const newHeight = document.body.scrollHeight;
      if (newHeight === lastHeight) {
        stableCount++;
        if (stableCount >= 2) {
          console.log('Page height is stable, ending scroll.');
          break; // Exit loop if height is stable for 2 cycles
        }
      } else {
        stableCount = 0;
      }
      lastHeight = newHeight;
    }
    console.log('Finished auto-scrolling.');
    window.scrollTo(0, 0); // Scroll back to top
  }

  isElementInViewport(el) {
    if (!el || typeof el.getBoundingClientRect !== 'function') {
      return false;
    }
    const rect = el.getBoundingClientRect();
    return (
      rect.top >= 0 &&
      rect.left >= 0 &&
      rect.bottom <= (window.innerHeight || document.documentElement.clientHeight) &&
      rect.right <= (window.innerWidth || document.documentElement.clientWidth)
    );
  }

  // Find the main content area of the page
  findMainContent() {
    // Special handling for Reddit
    if (window.location.hostname.includes('reddit.com')) {
      return this.findRedditContent();
    }

    // Try common main content selectors in order of preference
    const mainSelectors = [
      'main',
      '[role="main"]',
      '.main-content',
      '.content',
      '.post-content',
      '.entry-content',
      '.article-content',
      '.page-content',
      'article',
      '.container .content',
      '#content',
      '#main',
      '.main'
    ];

    for (const selector of mainSelectors) {
      const element = document.querySelector(selector);
      if (element && this.isValidContentArea(element)) {
        console.log(`Found main content using selector: ${selector}`);
        return element;
      }
    }

    // If no main content found, try to find the largest content area
    return this.findLargestContentArea();
  }

  // Special Reddit content detection
  findRedditContent() {
    console.log('Detecting Reddit content structure...');
    
    // Try Reddit-specific selectors
    const redditSelectors = [
      '[data-testid="post-container"]',
      '.Post',
      '[data-click-id="body"]',
      '.thing',
      '#siteTable',
      '.content[role="main"]',
      'shreddit-post',
      '[slot="post-media-container"]'
    ];

    for (const selector of redditSelectors) {
      const element = document.querySelector(selector);
      if (element) {
        console.log(`Found Reddit content using selector: ${selector}`);
        return element.closest('[data-testid="post-container"]') || element;
      }
    }

    // Fallback: look for the main content container
    const mainContent = document.querySelector('main') || 
                       document.querySelector('[role="main"]') ||
                       document.querySelector('#AppRouter-main-content');
    
    if (mainContent) {
      console.log('Found Reddit main content container');
      return mainContent;
    }

    console.log('No specific Reddit content found, using body fallback');
    return null;
  }

  // Check if an element is a valid content area
  isValidContentArea(element) {
    const text = element.innerText || '';
    const minLength = 100; // Minimum text length to consider valid
    
    // Skip if too little content
    if (text.length < minLength) return false;
    
    // Skip if it's likely navigation or header/footer
    const tagName = element.tagName.toLowerCase();
    const className = this.getElementClasses(element);
    const id = (element.id || '').toLowerCase();
    
    const skipPatterns = [
      'nav', 'header', 'footer', 'sidebar', 'menu', 'breadcrumb',
      'advertisement', 'ads', 'social', 'share', 'related'
    ];
    
    for (const pattern of skipPatterns) {
      if (tagName.includes(pattern) || className.includes(pattern) || id.includes(pattern)) {
        return false;
      }
    }
    
    return true;
  }

  // Find the largest content area as fallback
  findLargestContentArea() {
    const candidates = document.querySelectorAll('div, section, article');
    let largest = null;
    let maxLength = 0;

    for (const candidate of candidates) {
      if (this.isValidContentArea(candidate)) {
        const textLength = (candidate.innerText || '').length;
        if (textLength > maxLength) {
          maxLength = textLength;
          largest = candidate;
        }
      }
    }

    return largest;
  }

  // Scrape content from a specific element
  scrapeFromElement(element, markdown) {
    const processedElements = new Set();
    
    // Process elements in document order, but only within the specified element
    const walker = document.createTreeWalker(
      element,
      NodeFilter.SHOW_ELEMENT,
      {
        acceptNode: (node) => {
          // Skip if already processed
          if (processedElements.has(node)) {
            return NodeFilter.FILTER_REJECT;
          }
          
          // Skip navigation, ads, and other non-content elements
          if (this.shouldSkipElement(node)) {
            return NodeFilter.FILTER_REJECT;
          }
          
          return NodeFilter.FILTER_ACCEPT;
        }
      }
    );

    let currentNode;
    while (currentNode = walker.nextNode()) {
      // Skip if already processed or if it's inside another processed element
      if (processedElements.has(currentNode) || this.isInsideProcessedElement(currentNode, processedElements)) {
        continue;
      }

      const elementMarkdown = this.processElement(currentNode);
      if (elementMarkdown) {
        markdown += elementMarkdown;
        processedElements.add(currentNode);
      }
    }

    // Clean up the markdown
    markdown = this.cleanupMarkdown(markdown);
    return markdown;
  }

  // Check if element should be skipped
  shouldSkipElement(element) {
    const tagName = element.tagName.toLowerCase();
    const className = this.getElementClasses(element);
    const id = (element.id || '').toLowerCase();
    
    // Skip script, style, and other non-content tags
    const skipTags = ['script', 'style', 'noscript', 'iframe', 'embed', 'object'];
    if (skipTags.includes(tagName)) {
      return true;
    }
    
    // Skip elements with navigation, advertisement, or UI-related classes/IDs
    const skipPatterns = [
      'nav', 'navigation', 'menu', 'header', 'footer', 'sidebar',
      'breadcrumb', 'pagination', 'social', 'share', 'related',
      'advertisement', 'ads', 'banner', 'popup', 'modal',
      'search', 'filter', 'sort', 'toolbar', 'controls',
      'skip', 'hidden', 'sr-only', 'screen-reader'
    ];
    
    for (const pattern of skipPatterns) {
      if (className.includes(pattern) || id.includes(pattern)) {
        return true;
      }
    }
    
    // Skip if element is hidden
    const style = window.getComputedStyle(element);
    if (style.display === 'none' || style.visibility === 'hidden' || style.opacity === '0') {
      return true;
    }
    
    return false;
  }

  // Process individual element
  processElement(element) {
    try {
      if (!element || !element.tagName) {
        return '';
      }

      const tagName = element.tagName.toLowerCase();
      
      switch (tagName) {
        case 'h1':
          return `\n# ${this.cleanText(element.innerText || element.textContent || '')}\n`;
        case 'h2':
          return `\n## ${this.cleanText(element.innerText || element.textContent || '')}\n`;
        case 'h3':
          return `\n### ${this.cleanText(element.innerText || element.textContent || '')}\n`;
        case 'h4':
          return `\n#### ${this.cleanText(element.innerText || element.textContent || '')}\n`;
        case 'h5':
          return `\n##### ${this.cleanText(element.innerText || element.textContent || '')}\n`;
        case 'h6':
          return `\n###### ${this.cleanText(element.innerText || element.textContent || '')}\n`;

        case 'p':
          const text = this.cleanText(element.innerText || element.textContent || '');
          if (text && text.length > 20) { // Only include substantial paragraphs
            return `\n${text}\n`;
          }
          break;

        case 'blockquote':
          return `\n${this.blockquoteToMarkdown(element)}\n`;

        case 'pre':
          if (this.settings.includeCodeBlocks) {
            return this.codeBlockToMarkdown(element);
          }
          break;

        case 'table':
          if (this.settings.includeTables) {
            return this.tableToMarkdown(element);
          }
          break;

        case 'img':
          if (this.settings.includeImages) {
            return this.imageToMarkdown(element);
          }
          break;

        case 'ul':
          if (this.settings.includeLists && !element.closest('nav')) {
            return `\n${this.listToMarkdown(element, false)}\n`;
          }
          break;

        case 'ol':
          if (this.settings.includeLists && !element.closest('nav')) {
            return `\n${this.listToMarkdown(element, true)}\n`;
          }
          break;

        case 'hr':
          return '\n---\n';

        case 'div':
        case 'section':
        case 'article':
          // Only process div/section/article if it contains direct text (not just child elements)
          const directText = this.getDirectTextContent(element);
          if (directText && directText.length > 20) {
            return `\n${directText}\n`;
          }
          break;
      }
      
      return '';
    } catch (error) {
      console.warn('Error processing element:', error, element);
      return '';
    }
  }

  // Get direct text content (not from child elements)
  getDirectTextContent(element) {
    let text = '';
    for (const node of element.childNodes) {
      if (node.nodeType === Node.TEXT_NODE) {
        text += node.textContent;
      }
    }
    return this.cleanText(text);
  }

  // Check if element is inside an already processed element
  isInsideProcessedElement(element, processedElements) {
    let parent = element.parentElement;
    while (parent) {
      if (processedElements.has(parent)) {
        return true;
      }
      parent = parent.parentElement;
    }
    return false;
  }

  // Clean up the final markdown output
  cleanupMarkdown(markdown) {
    return markdown
      // Remove excessive line breaks
      .replace(/\n{4,}/g, '\n\n\n')
      // Fix spacing around headers
      .replace(/\n(#{1,6})/g, '\n\n$1')
      // Fix spacing after headers
      .replace(/(#{1,6}[^\n]*)\n([^\n#])/g, '$1\n\n$2')
      // Remove trailing whitespace
      .replace(/[ \t]+$/gm, '')
      // Ensure file ends with single newline
      .replace(/\n*$/, '\n');
  }

  // Handle selection-only scraping
  scrapeSelection(selectedText, settings = {}) {
    try {
      this.settings = { ...this.settings, ...settings };
      
      if (!selectedText) {
        return this.scrapeMarkdown(settings);
      }

      // Create a temporary container with the selected text
      const tempDiv = document.createElement('div');
      tempDiv.innerHTML = selectedText;
      
      // Process the selection similar to full page scraping
      let markdown = `# Selected Content\n\n`;
      markdown += `**Source:** ${window.location.href}\n`;
      markdown += `**Scraped:** ${new Date().toISOString()}\n\n---\n\n`;
      
      // Clean and return the selected text as markdown
      const cleanedText = this.cleanText(selectedText);
      markdown += cleanedText + '\n';
      
      return this.cleanupMarkdown(markdown);
      
    } catch (error) {
      console.error('Selection scraping error:', error);
      return `# Selection Scraping Error\n\nAn error occurred while scraping the selected content: ${error.message}`;
    }
  }
}

// Initialize the scraper
const scraper = new AdvancedMarkdownScraper();

// Asynchronous function to perform the actual scraping
async function performScraping(settings, selectionOnly = false, selectedText = '') {
  try {
    showScrapingIndicator();
    let markdown;

    if (selectionOnly && selectedText) {
      markdown = await scraper.scrapeSelection(selectedText, settings);
    } else {
      markdown = await scraper.scrapeMarkdown(settings);
    }

    hideScrapingIndicator();

    // Send the final result to the popup
    chrome.runtime.sendMessage({
      action: 'scraping_complete',
      data: {
        success: true,
        markdown: markdown,
        wordCount: markdown.split(/\s+/).filter(word => word.length > 0).length,
        timestamp: new Date().toISOString()
      }
    });
  } catch (error) {
    hideScrapingIndicator();
    console.error('Content script scraping error:', error);
    // Send a failure message to the popup
    chrome.runtime.sendMessage({
      action: 'scraping_failed',
      error: {
        message: error.message,
        stack: error.stack
      }
    });
  }
}

// Enhanced message listener with better error handling
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'scrape_md') {
    // Acknowledge the request immediately
    sendResponse({ success: true, status: 'scraping_started' });
    // Start the async scraping process
    performScraping(request.settings || {}, request.selectionOnly, request.selectedText);
  } else if (request.action === 'ping') {
    sendResponse({ success: true, status: 'Content script is active' });
  }

  // Return true to indicate that the response will be sent asynchronously (for other potential messages)
  // Although for 'scrape_md' the direct response is synchronous, this is a good practice.
  return true;
});

// Handle context menu scraping
document.addEventListener('contextmenu', (e) => {
  const selectedText = window.getSelection().toString();
  if (selectedText) {
    // Store selection for potential context menu action
    window.lastSelection = selectedText;
  }
});

// Add visual feedback for scraping process
let scrapingIndicator = null;

function showScrapingIndicator() {
  if (scrapingIndicator) return;
  
  scrapingIndicator = document.createElement('div');
  scrapingIndicator.style.cssText = `
    position: fixed;
    top: 20px;
    right: 20px;
    background: #3b82f6;
    color: white;
    padding: 12px 20px;
    border-radius: 8px;
    box-shadow: 0 4px 12px rgba(0,0,0,0.15);
    z-index: 10000;
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    font-size: 14px;
    font-weight: 500;
    animation: slideIn 0.3s ease;
  `;
  
  scrapingIndicator.innerHTML = `
    <div style="display: flex; align-items: center; gap: 8px;">
      <div style="width: 16px; height: 16px; border: 2px solid transparent; border-top: 2px solid white; border-radius: 50%; animation: spin 1s linear infinite;"></div>
      Scraping page...
    </div>
  `;
  
  // Add CSS animations
  const style = document.createElement('style');
  style.textContent = `
    @keyframes slideIn {
      from { transform: translateX(100%); opacity: 0; }
      to { transform: translateX(0); opacity: 1; }
    }
    @keyframes spin {
      to { transform: rotate(360deg); }
    }
  `;
  document.head.appendChild(style);
  
  document.body.appendChild(scrapingIndicator);
  
  // Auto-remove after 5 seconds
  setTimeout(hideScrapingIndicator, 5000);
}

function hideScrapingIndicator() {
  if (scrapingIndicator) {
    scrapingIndicator.remove();
    scrapingIndicator = null;
  }
}

// Prevent multiple injections
if (window.markdownScraperLoaded) {
  console.log('Advanced Markdown Scraper already loaded');
} else {
  window.markdownScraperLoaded = true;
  console.log('Advanced Markdown Scraper content script loaded');
}
  
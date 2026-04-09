class MyBrowser {
  constructor() {
    this.tabs = [];
    this.activeTabId = null;
    this.homePage = 'https://www.google.com';
    this.bookmarks = [];
    this.tabIdCounter = 0;

    this.init();
  }

  async init() {
    // Load settings from main process
    const settings = await window.electronAPI.getSettings();
    this.homePage = settings.homePage;
    this.bookmarks = settings.bookmarks;

    // Setup UI event listeners
    this.setupEventListeners();

    // Load bookmarks
    this.renderBookmarks();

    // Create first tab
    this.createTab(this.homePage);
  }

  setupEventListeners() {
    // Navigation buttons
    document.getElementById('backBtn').addEventListener('click', () => this.navigateBack());
    document.getElementById('forwardBtn').addEventListener('click', () => this.navigateForward());
    document.getElementById('reloadBtn').addEventListener('click', () => this.reload());
    document.getElementById('homeBtn').addEventListener('click', () => this.goHome());

    // Address bar
    const addressBar = document.getElementById('addressBar');
    addressBar.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') {
        let url = addressBar.value.trim();
        if (!url.startsWith('http://') && !url.startsWith('https://')) {
          url = 'https://' + url;
        }
        this.navigateTo(url);
      }
    });

    // Tab controls
    document.getElementById('newTabBtn').addEventListener('click', () => this.createTab(this.homePage));

    // Keyboard shortcuts
    document.addEventListener('keydown', (e) => {
      if (e.ctrlKey || e.metaKey) {
        if (e.key === 't') {
          e.preventDefault();
          this.createTab(this.homePage);
        } else if (e.key === 'w') {
          e.preventDefault();
          if (this.activeTabId !== null) {
            this.closeTab(this.activeTabId);
          }
        } else if (e.key === '+' || e.key === '=') {
          e.preventDefault();
          const webview = document.querySelector('webview.active');
          if (webview) webview.setZoomLevel((webview.getZoomLevel() || 0) + 1);
        } else if (e.key === '-') {
          e.preventDefault();
          const webview = document.querySelector('webview.active');
          if (webview) webview.setZoomLevel((webview.getZoomLevel() || 1) - 1);
        } else if (e.key === '0') {
          e.preventDefault();
          const webview = document.querySelector('webview.active');
          if (webview) webview.setZoomLevel(0);
        }
      } else if (e.altKey) {
        if (e.key === 'ArrowLeft') {
          e.preventDefault();
          this.navigateBack();
        } else if (e.key === 'ArrowRight') {
          e.preventDefault();
          this.navigateForward();
        }
      }
    });
  }

  createTab(url = this.homePage) {
    const tabId = this.tabIdCounter++;
    const tab = {
      id: tabId,
      url: url,
      title: 'Loading...',
      canGoBack: false,
      canGoForward: false
    };

    this.tabs.push(tab);

    // Create webview element
    const webview = document.createElement('webview');
    webview.id = `webview-${tabId}`;
    webview.src = url;
    webview.classList.add('active');

    // Setup webview event listeners
    this.setupWebviewListeners(webview, tab);

    document.getElementById('webviewContainer').appendChild(webview);

    // Render tab in tab bar
    this.renderTabBar();

    // Switch to new tab
    this.switchTab(tabId);
  }

  setupWebviewListeners(webview, tab) {
    webview.addEventListener('page-title-updated', (e) => {
      tab.title = e.title || 'Untitled';
      this.renderTabBar();
    });

    webview.addEventListener('did-navigate', (e) => {
      tab.url = e.url;
      this.updateAddressBar();
      this.updateNavButtons();
    });

    webview.addEventListener('did-navigate-in-page', (e) => {
      tab.url = e.url;
      this.updateAddressBar();
    });

    webview.addEventListener('did-start-loading', () => {
      document.getElementById('loadingIndicator').classList.remove('hidden');
    });

    webview.addEventListener('did-stop-loading', () => {
      document.getElementById('loadingIndicator').classList.add('hidden');
      this.updateNavButtons();
    });

    webview.addEventListener('crashed', () => {
      tab.title = 'Crashed';
      this.renderTabBar();
    });
  }

  switchTab(tabId) {
    // Hide all webviews
    document.querySelectorAll('webview').forEach(wv => {
      wv.classList.remove('active');
    });

    // Show selected webview
    const webview = document.getElementById(`webview-${tabId}`);
    if (webview) {
      webview.classList.add('active');
      webview.focus();
    }

    this.activeTabId = tabId;
    this.renderTabBar();
    this.updateAddressBar();
    this.updateNavButtons();
  }

  closeTab(tabId) {
    const index = this.tabs.findIndex(t => t.id === tabId);
    if (index === -1) return;

    // Remove webview
    const webview = document.getElementById(`webview-${tabId}`);
    if (webview) webview.remove();

    // Remove tab
    this.tabs.splice(index, 1);

    // If closed tab was active, switch to another
    if (this.activeTabId === tabId) {
      if (this.tabs.length > 0) {
        const nextTab = this.tabs[Math.max(0, index - 1)];
        this.switchTab(nextTab.id);
      } else {
        // Create new tab if all closed
        this.createTab(this.homePage);
      }
    } else {
      this.renderTabBar();
    }
  }

  navigateBack() {
    const webview = document.querySelector('webview.active');
    if (webview && webview.canGoBack()) {
      webview.goBack();
    }
  }

  navigateForward() {
    const webview = document.querySelector('webview.active');
    if (webview && webview.canGoForward()) {
      webview.goForward();
    }
  }

  reload() {
    const webview = document.querySelector('webview.active');
    if (webview) {
      webview.reload();
    }
  }

  goHome() {
    this.navigateTo(this.homePage);
  }

  navigateTo(url) {
    const webview = document.querySelector('webview.active');
    if (webview) {
      webview.src = url;
    }
  }

  updateAddressBar() {
    const activeTab = this.tabs.find(t => t.id === this.activeTabId);
    if (activeTab) {
      document.getElementById('addressBar').value = activeTab.url;
    }
  }

  updateNavButtons() {
    const webview = document.querySelector('webview.active');
    const backBtn = document.getElementById('backBtn');
    const forwardBtn = document.getElementById('forwardBtn');

    if (webview) {
      backBtn.disabled = !webview.canGoBack();
      forwardBtn.disabled = !webview.canGoForward();
    }
  }

  renderTabBar() {
    const tabBar = document.getElementById('tabBar');
    tabBar.innerHTML = '';

    this.tabs.forEach(tab => {
      const tabEl = document.createElement('div');
      tabEl.className = `tab ${tab.id === this.activeTabId ? 'active' : ''}`;
      tabEl.innerHTML = `
        <div class="tab-title">${tab.title}</div>
        <div class="tab-close">✕</div>
      `;

      tabEl.addEventListener('click', () => this.switchTab(tab.id));
      tabEl.querySelector('.tab-close').addEventListener('click', (e) => {
        e.stopPropagation();
        this.closeTab(tab.id);
      });

      tabBar.appendChild(tabEl);
    });
  }

  renderBookmarks() {
    const bookmarkBar = document.getElementById('bookmarkBar');
    bookmarkBar.innerHTML = '';

    // Add bookmark button
    const addBtn = document.createElement('button');
    addBtn.textContent = '★ Add Bookmark';
    addBtn.style.cssText = `
      padding: 4px 12px;
      background-color: #4285f4;
      color: white;
      border: none;
      border-radius: 3px;
      cursor: pointer;
      font-size: 12px;
      transition: all 0.2s ease;
    `;
    addBtn.onmouseover = () => (addBtn.style.backgroundColor = '#1f73db');
    addBtn.onmouseout = () => (addBtn.style.backgroundColor = '#4285f4');
    addBtn.addEventListener('click', () => this.addCurrentPageAsBookmark());
    bookmarkBar.appendChild(addBtn);

    // Render bookmarks
    this.bookmarks.forEach((bookmark, index) => {
      const bookmarkEl = document.createElement('div');
      bookmarkEl.className = 'bookmark-item';
      bookmarkEl.innerHTML = `
        ${bookmark.title}
        <span class="bookmark-remove">×</span>
      `;

      bookmarkEl.addEventListener('click', () => this.navigateTo(bookmark.url));
      bookmarkEl.querySelector('.bookmark-remove').addEventListener('click', (e) => {
        e.stopPropagation();
        this.removeBookmark(index);
      });

      bookmarkBar.appendChild(bookmarkEl);
    });
  }

  async addCurrentPageAsBookmark() {
    const activeTab = this.tabs.find(t => t.id === this.activeTabId);
    if (activeTab) {
      const bookmark = {
        title: activeTab.title || 'Bookmark',
        url: activeTab.url
      };

      this.bookmarks.push(bookmark);
      await window.electronAPI.addBookmark(bookmark);
      this.renderBookmarks();

      // Show feedback
      alert(`✓ Bookmarked: ${bookmark.title}`);
    }
  }

  async removeBookmark(index) {
    this.bookmarks.splice(index, 1);
    await window.electronAPI.removeBookmark(index);
    this.renderBookmarks();
  }
}

// Initialize browser when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
  new MyBrowser();
});
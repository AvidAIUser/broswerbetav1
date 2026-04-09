const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  // Settings Management
  getSettings: () => ipcRenderer.invoke('get-settings'),
  setHomePage: (url) => ipcRenderer.invoke('set-home-page', url),
  
  // Bookmark Management
  addBookmark: (bookmark) => ipcRenderer.invoke('add-bookmark', bookmark),
  removeBookmark: (index) => ipcRenderer.invoke('remove-bookmark', index),
  getBookmarks: () => ipcRenderer.invoke('get-bookmarks'),
  
  // System Info
  getAppPath: () => process.resourcesPath
});
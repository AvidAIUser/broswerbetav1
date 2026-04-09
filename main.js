const { app, BrowserWindow, Menu, ipcMain } = require('electron');
const path = require('path');
const Store = require('electron-store');

const store = new Store();

let mainWindow;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      nodeIntegration: false,
      contextIsolation: true,
      enableRemoteModule: false,
      sandbox: true,
      webviewTag: false
    }
  });

  mainWindow.loadFile('src/index.html');
  mainWindow.webContents.openDevTools(); // Remove in production
}

app.on('ready', () => {
  createWindow();
  createMenu();
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  if (mainWindow === null) {
    createWindow();
  }
});

// IPC Handlers for Settings
ipcMain.handle('get-settings', async () => {
  return {
    homePage: store.get('homePage', 'https://www.google.com'),
    bookmarks: store.get('bookmarks', [])
  };
});

ipcMain.handle('set-home-page', async (event, url) => {
  store.set('homePage', url);
  return { success: true };
});

ipcMain.handle('add-bookmark', async (event, bookmark) => {
  let bookmarks = store.get('bookmarks', []);
  bookmarks.push(bookmark);
  store.set('bookmarks', bookmarks);
  return { success: true, bookmarks };
});

ipcMain.handle('remove-bookmark', async (event, index) => {
  let bookmarks = store.get('bookmarks', []);
  bookmarks.splice(index, 1);
  store.set('bookmarks', bookmarks);
  return { success: true, bookmarks };
});

ipcMain.handle('get-bookmarks', async () => {
  return store.get('bookmarks', []);
});

function createMenu() {
  const template = [
    {
      label: 'File',
      submenu: [
        {
          label: 'Exit',
          accelerator: 'CmdOrCtrl+Q',
          click: () => {
            app.quit();
          }
        }
      ]
    },
    {
      label: 'Edit',
      submenu: [
        { label: 'Undo', accelerator: 'CmdOrCtrl+Z', role: 'undo' },
        { label: 'Redo', accelerator: 'CmdOrCtrl+Y', role: 'redo' },
        { type: 'separator' },
        { label: 'Cut', accelerator: 'CmdOrCtrl+X', role: 'cut' },
        { label: 'Copy', accelerator: 'CmdOrCtrl+C', role: 'copy' },
        { label: 'Paste', accelerator: 'CmdOrCtrl+V', role: 'paste' }
      ]
    },
    {
      label: 'View',
      submenu: [
        { label: 'Reload', accelerator: 'CmdOrCtrl+R', role: 'reload' },
        { label: 'Hard Reload', accelerator: 'CmdOrCtrl+Shift+R', role: 'forceReload' },
        { label: 'Toggle DevTools', accelerator: 'F12', role: 'toggleDevTools' }
      ]
    }
  ];

  Menu.setApplicationMenu(Menu.buildFromTemplate(template));
}
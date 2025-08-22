const { app, BrowserWindow, Menu } = require('electron');
const path = require('path');

function createWindow() {
  const iconPath = app.isPackaged
    ? path.join(__dirname, 'dist', 'logo.png')
    : path.join(__dirname, 'public', 'logo.png');
  const win = new BrowserWindow({
    width: 1000,
    height: 800,
    icon: iconPath, // App icon
    webPreferences: {
      // Remove or update preload if not used
      // preload: path.join(__dirname, 'preload.js'),
      nodeIntegration: true,
      contextIsolation: false,
    },
  });

  if (!app.isPackaged) {
    // Development: load Vite dev server
    win.loadURL('http://localhost:5173'); // Or 5174 if that's the port Vite uses
  } else {
    // Production: load built file
    win.loadFile(path.join(__dirname, 'dist', 'index.html'));
  }
}

app.whenReady().then(() => {
  // Remove the default application menu (File/Edit/View/Window/Help)
  Menu.setApplicationMenu(null);
  createWindow();
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) createWindow();
});
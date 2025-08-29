const { app, BrowserWindow, ipcMain, Menu, dialog } = require('electron');
const { autoUpdater } = require("electron-updater");
const RPC = require('discord-rpc');
const axios = require('axios');
const path = require('path');
require('dotenv').config();
const clientId = '1272682685730521118';

let mainWindow;
let pluginName;
const rpc = new RPC.Client({ transport: 'ipc' });
let startTimestamp = new Date();

rpc.on('ready', () => {
  console.log('Discord RPC is ready');
});

rpc.login({ clientId }).catch(console.error);

async function updateDiscordStatus(username) {
  try {
    const response = await axios.get(`http://localhost:8000/get_location/?username=${username}`);
    if (response.data.location) {
      const location = response.data.location;
      rpc.setActivity({
        details: username,
        state: `${location}`,
        startTimestamp: startTimestamp,
        largeImageKey: 'main',
        largeImageText: "Cocolani Islands",
      });
    } else {
      console.error('No location found');
    }
  } catch (error) {
    console.error('Error fetching location:', error);
  }
}

let imageName;

switch (process.platform) {
  case 'win32':
    imageName = 'windows_icon';
    switch (process.arch) {
      case 'ia32':
      case 'x32':
        pluginName = 'flash/windows/32/pepflashplayer.dll';
        break;
      case 'x64':
      case 'arm64': // fallback to 64-bit plugin for arm64 builds that run x64 emulation
        pluginName = 'flash/windows/64/pepflashplayer.dll';
        break;
      default:
        pluginName = 'flash/windows/64/pepflashplayer.dll';
        break;
    }
    break;
  case 'linux':
    imageName = 'linux_icon';
    switch (process.arch) {
      case 'ia32':
      case 'x32':
        pluginName = 'flash/linux/32/libpepflashplayer.so';
        break;
      case 'x64':
      case 'arm64':
        pluginName = 'flash/linux/64/libpepflashplayer.so';
        break;
      default:
        pluginName = 'flash/linux/64/libpepflashplayer.so';
        break;
    }
    app.commandLine.appendSwitch('no-sandbox');
    break;
  case 'darwin':
    imageName = 'mac_os_icon';
    pluginName = 'flash/mac/PepperFlashPlayer.plugin';
    break;
  default:
    pluginName = null;
    break;
}

// Resolve Flash plugin path correctly for dev vs packaged builds.
// In production the assets should be placed via electron-builder extraResources under process.resourcesPath.
if (pluginName) {
  const baseDir = app.isPackaged ? process.resourcesPath : __dirname;
  const flashPluginPath = path.join(baseDir, pluginName);
  app.commandLine.appendSwitch('ppapi-flash-path', flashPluginPath);
}

// Optional: disable HTTP cache (kept from original)
app.commandLine.appendSwitch("disable-http-cache");

function createWindow() {
  mainWindow = new BrowserWindow({
    useContentSize: true,
    width: 800,
    height: 600,
    title: "Cocolani Islands",
    icon: path.join(__dirname, 'images/favicon.png'),
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
      plugins: true,
    },
  });

  mainWindow.loadURL('http://147.185.221.31:31984/login?next=play');
  mainWindow.setMenuBarVisibility(false);
  Menu.setApplicationMenu(null);

  mainWindow.webContents.on('did-navigate', (event, newUrl) => {
    if (newUrl.includes('play')) {
      mainWindow.webContents.executeJavaScript(`
        document.getElementById('username').value
      `).then(username => {
        if (username) {
          updateDiscordStatus(username);
        } else {
          console.error('Username not found');
        }
      });
    }
  });
}

function checkForUpdates() {
  autoUpdater.checkForUpdatesAndNotify();
}

autoUpdater.on('checking-for-update', () => {});
autoUpdater.on('update-available', () => {});
autoUpdater.on('update-not-available', () => {});
autoUpdater.on('error', (err) => {
  dialog.showErrorBox('Update Error', err == null ? "unknown" : err.stack);
});
autoUpdater.on('update-downloaded', () => {
  dialog.showMessageBox({
    type: 'info',
    buttons: ['Restart', 'Later'],
    title: 'Update Available',
    message: 'A new version has been downloaded. Restart the app to apply the update.'
  }).then((result) => {
    if (result.response === 0) {
      autoUpdater.quitAndInstall();
    }
  });
});

app.whenReady().then(() => {
  checkForUpdates();
  createWindow();

  ipcMain.on('username', (event, username) => {
    updateDiscordStatus(username);
  });

  ipcMain.on('location-update', (event, username) => {
    updateDiscordStatus(username);
  });

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

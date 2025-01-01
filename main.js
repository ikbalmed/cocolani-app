const { app, BrowserWindow, ipcMain, Menu, dialog } = require('electron');
const { autoUpdater } = require("electron-updater");
const path = require('path');
require('dotenv').config();
const clientId = 'YOUR_DISCORD_CLIENT_ID';

const githubToken = process.env.GITHUB_TOKEN;

let mainWindow;
let pluginName;

const rpc = new RPC.Client({ transport: 'ipc' });

rpc.on('ready', () => {
  console.log('Discord RPC is ready');
});

// Initialize the Discord RPC
rpc.login({ clientId }).catch(console.error);

// Function to update the Discord status
async function updateDiscordStatus(username) {
  try {
    // Fetch the location from your Django API
    const response = await axios.get(`http://localhost:8000/get_location/?username=${username}`);
    
    if (response.data.location) {
      const location = response.data.location;

      // Set the Discord status with the location
      rpc.setActivity({
        details: 'Cocolani Islands',
        state: `Location: ${location}`,
        startTimestamp: new Date(),
        largeImageKey: 'cocolani_logo',
        largeImageText: 'Cocolani Islands',
        smallImageKey: 'user_avatar',
        smallImageText: location,
      });
    } else {
      console.error('No location found');
    }
  } catch (error) {
    console.error('Error fetching location:', error);
  }
}

switch (process.platform) {
  case 'win32':
    imageName = 'windows_icon';
    switch (process.arch) {
      case 'ia32':
      case 'x32':
        pluginName = 'flash/windows/32/pepflashplayer.dll';
        break;
      case 'x64':
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
        pluginName = 'flash/linux/64/libpepflashplayer.so';
        break;
    }
    app.commandLine.appendSwitch('no-sandbox');
    break;
  case 'darwin':
    imageName = 'mac_os_icon';
    pluginName = 'flash/mac/PepperFlashPlayer.plugin';
    break;
}

app.commandLine.appendSwitch('ppapi-flash-path', path.join(__dirname, pluginName));
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

  mainWindow.loadURL('http://localhost:8000/login?next=play');

  mainWindow.webContents.openDevTools = () => {};

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

autoUpdater.on('checking-for-update', () => {
  console.log('Checking for updates...');
});

autoUpdater.on('update-available', () => {
  console.log('Update available.');
});

autoUpdater.on('update-not-available', () => {
  console.log('No updates available.');
});

autoUpdater.on('error', (err) => {
  console.error('Error in auto-updater:', err);
  dialog.showErrorBox('Update Error', err == null ? "unknown" : err.stack);
});

autoUpdater.on('update-downloaded', () => {
  console.log('Update downloaded.');
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

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

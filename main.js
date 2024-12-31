const { app, BrowserWindow, ipcMain, Menu } = require('electron');
const path = require('path');

let mainWindow;
let pluginName
switch (process.platform) {
	case 'win32':
		imageName = 'windows_icon';
		switch (process.arch) {
			case 'ia32':
			case 'x32':
				pluginName = 'flash/windows/32/pepflashplayer.dll'
				break
			case 'x64':
				pluginName = 'flash/windows/64/pepflashplayer.dll'
				break
			}
		break
	case 'linux':
		imageName = 'linux_icon';
		switch (process.arch) {
			case 'ia32':
			case 'x32':
				pluginName = 'flash/linux/32/libpepflashplayer.so'
				break
			case 'x64':
				pluginName = 'flash/linux/64/libpepflashplayer.so'
				break
			}
		
		app.commandLine.appendSwitch('no-sandbox');
		break
	case 'darwin':
		imageName = 'mac_os_icon';
		pluginName = 'flash/mac/PepperFlashPlayer.plugin'
		break
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
      preload: path.join(__dirname, 'preload.js'), // Ensure preload.js is linked correctly
      contextIsolation: true, // Enable context isolation
      nodeIntegration: false, // Disable Node integration for security
      plugins: true,  // Enable plugins (Flash)
    },
  });

  // Load the index.html file or the URL where your Flash content is hosted
  mainWindow.loadURL('http://localhost:8000/login?next=play');  // Replace with your actual login URL

  // Disable the developer tools
  mainWindow.webContents.openDevTools = () => {};  // Disable devtools from opening

  // Hide the menu bar
  mainWindow.setMenuBarVisibility(false);

  // Remove default menu (optional)
  Menu.setApplicationMenu(null);
}

// Event when the app is ready
app.whenReady().then(() => {
  createWindow();

  app.on('activate', () => {
    // Re-create a window in the app if the dock icon is clicked (macOS)
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

// Quit when all windows are closed (except on macOS)
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

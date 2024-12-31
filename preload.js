const { contextBridge, ipcRenderer } = require('electron');

// Expose the 'openLogin' function to the renderer process
contextBridge.exposeInMainWorld('electron', {
  openLogin: () => ipcRenderer.send('open-login')
});

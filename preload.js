const { ipcRenderer } = require('electron');

window.addEventListener('DOMContentLoaded', () => {
  const buttonElement = document.getElementById('loc');
  const usernameElement = document.getElementById('username');

  if (buttonElement && usernameElement) {
    const username = usernameElement.value;

    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (mutation.attributeName === 'value') {
          ipcRenderer.send('location-update', username);
        }
      });
    });

    observer.observe(buttonElement, { attributes: true });
  }
});

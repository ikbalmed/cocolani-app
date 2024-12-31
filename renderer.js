// Event listener for the login button
document.getElementById('login-button').addEventListener('click', () => {
    // Call the exposed 'openLogin' function from preload.js
    window.electron.openLogin();
  });
  
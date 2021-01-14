import { app, BrowserWindow, ipcMain } from 'electron';
import predict from './backend';
import path = require('path');

app.on('ready', () => {
  createMainWindow();
});

function createMainWindow() {
  const mainWindow = new BrowserWindow({
    webPreferences: {
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.js'),
    },
  });
  mainWindow.loadFile(path.join(__dirname, 'static', 'index.html'));
  return mainWindow;
}

// communication with render
ipcMain.on('transcribe', async (_, audioData: ArrayBuffer) => {
  console.log(audioData);
  const result = predict(Buffer.from(audioData));
  console.log(`Result: ${result}`);
});

import { contextBridge, ipcRenderer } from 'electron';

contextBridge.exposeInMainWorld('electronMain', {
  transcribe: (audioData: ArrayBuffer) =>
    ipcRenderer.send('transcribe', audioData),
});

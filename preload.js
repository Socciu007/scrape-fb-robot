/**
 * The preload script runs before `index.html` is loaded
 * in the renderer. It has access to web APIs as well as
 * Electron's renderer process modules and some polyfilled
 * Node.js functions.
 *
 * https://www.electronjs.org/docs/latest/tutorial/sandbox
 */

const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronBridge', {
  handleSelectAccount: (data) => ipcRenderer.invoke("data-input", data),
  sendDataChat: (data) => ipcRenderer.invoke("data-chat", data),
  requireAction: (action) => ipcRenderer.invoke("require-action", action)
});
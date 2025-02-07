/**
 * The preload script runs before `index.html` is loaded
 * in the renderer. It has access to web APIs as well as
 * Electron's renderer process modules and some polyfilled
 * Node.js functions.
 *
 * https://www.electronjs.org/docs/latest/tutorial/sandbox
 */
window.addEventListener('DOMContentLoaded', () => {
  const replaceText = (selector, text) => {
    const element = document.getElementById(selector)
    if (element) element.innerText = text
  }

  for (const type of ['chrome', 'node', 'electron']) {
    replaceText(`${type}-version`, process.versions[type])
  }
})

const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  playAllActions: (formData) => ipcRenderer.invoke('play-all-actions', formData),
  fetchPortSuggestions: (query) => ipcRenderer.invoke('fetch-port-suggestions', query),
  // playAllActionsOOCL: (formData) => ipcRenderer.invoke('play-all-actions-oocl', formData),
  minimizeWindow: () => ipcRenderer.invoke('minimize-window'),
  onAutoStart: (callback) => ipcRenderer.on('auto-start', (_event) => callback())
});
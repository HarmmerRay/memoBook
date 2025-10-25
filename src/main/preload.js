const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  addTodo: (content) => ipcRenderer.invoke('add-todo', content),
  getTodos: () => ipcRenderer.invoke('get-todos'),
  updateTodo: (id, updates) => ipcRenderer.invoke('update-todo', id, updates),
  deleteTodo: (id) => ipcRenderer.invoke('delete-todo', id),
  playSound: (type) => ipcRenderer.invoke('play-sound', type),
  getAutoLaunchStatus: () => ipcRenderer.invoke('get-auto-launch-status'),
  toggleAutoLaunch: () => ipcRenderer.invoke('toggle-auto-launch'),
});
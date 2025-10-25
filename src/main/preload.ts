import { contextBridge, ipcRenderer } from 'electron';

contextBridge.exposeInMainWorld('electronAPI', {
  addTodo: (content: string) => ipcRenderer.invoke('add-todo', content),
  getTodos: () => ipcRenderer.invoke('get-todos'),
  updateTodo: (id: number, updates: any) => ipcRenderer.invoke('update-todo', id, updates),
  deleteTodo: (id: number) => ipcRenderer.invoke('delete-todo', id),
  playSound: (type: 'add' | 'complete' | 'delete') => ipcRenderer.invoke('play-sound', type),
  getAutoLaunchStatus: () => ipcRenderer.invoke('get-auto-launch-status'),
  toggleAutoLaunch: () => ipcRenderer.invoke('toggle-auto-launch'),
});
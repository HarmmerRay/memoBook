export interface ElectronAPI {
  addTodo: (content: string) => Promise<any>;
  getTodos: () => Promise<any[]>;
  updateTodo: (id: number, updates: any) => Promise<boolean>;
  deleteTodo: (id: number) => Promise<boolean>;
  playSound: (type: 'add' | 'complete' | 'delete') => Promise<void>;
  getAutoLaunchStatus: () => Promise<boolean>;
  toggleAutoLaunch: () => Promise<boolean>;
  moveWindow: (x: number, y: number) => Promise<void>;
  getWindowBounds: () => Promise<{ x: number; y: number; width: number; height: number } | null>;
}

declare global {
  interface Window {
    electronAPI: ElectronAPI;
  }
}
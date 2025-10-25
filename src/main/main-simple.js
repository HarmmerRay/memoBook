const { app, Tray, Menu, nativeImage, ipcMain, globalShortcut, BrowserWindow } = require('electron');
const path = require('path');

// Simple mock database for testing
class MockDatabase {
  constructor() {
    this.todos = [];
    this.nextId = 1;
  }

  addTodo(content) {
    const todo = {
      id: this.nextId++,
      content,
      createdDate: new Date().toISOString(),
      status: 'pending'
    };
    this.todos.push(todo);
    return todo;
  }

  getTodos() {
    return this.todos.filter(todo => todo.status !== 'deleted');
  }

  updateTodo(id, updates) {
    const todo = this.todos.find(t => t.id === id);
    if (todo) {
      Object.assign(todo, updates);
      return true;
    }
    return false;
  }

  deleteTodo(id) {
    return this.updateTodo(id, { status: 'deleted' });
  }

  close() {}
}

class MemoBookApp {
  constructor() {
    this.tray = null;
    this.database = new MockDatabase();
    this.windowManager = new WindowManagerService();
    this.isQuitting = false;
    this.setupIPC();
  }

  setupIPC() {
    ipcMain.handle('add-todo', async (_, content) => {
      return this.database.addTodo(content);
    });

    ipcMain.handle('get-todos', async () => {
      return this.database.getTodos();
    });

    ipcMain.handle('update-todo', async (_, id, updates) => {
      return this.database.updateTodo(id, updates);
    });

    ipcMain.handle('delete-todo', async (_, id) => {
      return this.database.deleteTodo(id);
    });

    ipcMain.handle('play-sound', async (_, soundType) => {
      console.log('Play sound:', soundType);
    });

    ipcMain.handle('get-auto-launch-status', async () => {
      return false;
    });

    ipcMain.handle('toggle-auto-launch', async () => {
      return false;
    });
  }

  setupTray() {
    try {
      // Create a simple tray icon
      const iconPath = path.join(__dirname, '../assets/tray-icon.png');
      const trayIcon = nativeImage.createFromPath(iconPath);

      if (trayIcon.isEmpty()) {
        console.warn('Tray icon not found, using default icon');
        // Create a simple 1x1 icon as fallback
        const emptyIcon = nativeImage.createEmpty();
        this.tray = new Tray(emptyIcon);
      } else {
        this.tray = new Tray(trayIcon.resize({ width: 16, height: 16 }));
      }

      const contextMenu = Menu.buildFromTemplate([
        {
          label: '开机自启动',
          type: 'checkbox',
          checked: false,
          click: () => {
            console.log('Toggle auto launch');
          }
        },
        { type: 'separator' },
        {
          label: '退出',
          click: () => {
            this.isQuitting = true;
            app.quit();
          }
        }
      ]);

      this.tray.setContextMenu(contextMenu);
    } catch (error) {
      console.warn('Failed to create tray:', error.message);
    }
  }

  setupGlobalShortcuts() {
    const platform = process.platform;
    const modifier = platform === 'darwin' ? 'Cmd' : 'Ctrl';

    try {
      globalShortcut.register(`${modifier}+Alt+Q`, () => {
        console.log('Input window shortcut triggered');
        this.windowManager.showInputWindow();
      });

      globalShortcut.register(`${modifier}+Alt+P`, () => {
        console.log('List window shortcut triggered');
        this.windowManager.toggleListWindow();
      });

      console.log(`Global shortcuts registered: ${modifier}+Alt+Q, ${modifier}+Alt+P`);
    } catch (error) {
      console.warn('Failed to register global shortcuts:', error.message);
    }
  }

  async initialize() {
    await app.whenReady();
    console.log('MemoBook app starting...');

    this.setupTray();
    this.setupGlobalShortcuts();

    app.on('window-all-closed', () => {
      if (process.platform !== 'darwin') {
        if (!this.isQuitting) {
          app.hide();
        }
      }
    });

    app.on('activate', () => {
      if (BrowserWindow.getAllWindows().length === 0) {
        this.windowManager.showInputWindow();
      }
    });

    app.on('before-quit', () => {
      this.isQuitting = true;
      globalShortcut.unregisterAll();
      this.database.close();
    });

    console.log('MemoBook app initialized successfully');
  }

  shutdown() {
    this.isQuitting = true;
    globalShortcut.unregisterAll();
    this.database.close();
    app.quit();
  }
}

class WindowManagerService {
  constructor() {
    this.inputWindow = null;
    this.listWindow = null;
    this.isListWindowVisible = false;
  }

  showInputWindow() {
    if (this.inputWindow) {
      this.inputWindow.focus();
      return;
    }

    const { screen } = require('electron');
    const { width, height } = screen.getPrimaryDisplay().workAreaSize;

    this.inputWindow = new BrowserWindow({
      width: 400,
      height: 200,
      x: (width - 400) / 2,
      y: (height - 200) / 2,
      frame: false,
      alwaysOnTop: true,
      resizable: false,
      skipTaskbar: true,
      show: false,
      webPreferences: {
        preload: path.join(__dirname, 'preload.js'),
        contextIsolation: true,
        nodeIntegration: false,
      }
    });

    this.inputWindow.loadFile('dist/index.html', { hash: 'input' });

    this.inputWindow.once('ready-to-show', () => {
      this.inputWindow.show();
      this.inputWindow.focus();
    });

    this.inputWindow.on('blur', () => {
      if (this.inputWindow) {
        this.inputWindow.close();
        this.inputWindow = null;
      }
    });

    this.inputWindow.on('closed', () => {
      this.inputWindow = null;
    });
  }

  showListWindow() {
    if (this.listWindow) {
      this.listWindow.focus();
      return;
    }

    this.listWindow = new BrowserWindow({
      width: 300,
      height: 500,
      x: 0,
      y: -500,
      frame: false,
      alwaysOnTop: true,
      resizable: false,
      skipTaskbar: true,
      show: false,
      transparent: true,
      webPreferences: {
        preload: path.join(__dirname, 'preload.js'),
        contextIsolation: true,
        nodeIntegration: false,
      }
    });

    this.listWindow.loadFile('dist/index.html', { hash: 'list' });

    this.listWindow.on('blur', () => {
      this.hideListWindow();
    });

    this.listWindow.on('closed', () => {
      this.listWindow = null;
      this.isListWindowVisible = false;
    });
  }

  hideListWindow() {
    if (this.listWindow && this.isListWindowVisible) {
      this.listWindow.setBounds({ x: 0, y: -500 });
      this.isListWindowVisible = false;
    }
  }

  toggleListWindow() {
    if (!this.listWindow) {
      this.showListWindow();
      setTimeout(() => this.showListWindowContent(), 100);
      return;
    }

    if (this.isListWindowVisible) {
      this.hideListWindow();
    } else {
      this.showListWindowContent();
    }
  }

  showListWindowContent() {
    if (this.listWindow) {
      this.listWindow.setBounds({ x: 0, y: 0 });
      this.listWindow.show();
      this.listWindow.focus();
      this.isListWindowVisible = true;
    }
  }
}

const memoBook = new MemoBookApp();
memoBook.initialize().catch(console.error);

process.on('SIGINT', () => {
  memoBook.shutdown();
});

process.on('SIGTERM', () => {
  memoBook.shutdown();
});
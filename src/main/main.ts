import { app, Tray, Menu, nativeImage, ipcMain, globalShortcut, BrowserWindow } from 'electron';
import * as path from 'path';
import AutoLaunch from 'auto-launch';
import SQLiteDatabaseService from './database';
import WindowManagerService from './windowManager';

class MemoBookApp {
  private tray: Tray | null = null;
  private database: SQLiteDatabaseService;
  private windowManager: WindowManagerService;
  private autoLauncher: AutoLaunch | undefined;
  private isQuitting = false;

  constructor() {
    this.database = new SQLiteDatabaseService();
    this.windowManager = new WindowManagerService();
    this.setupAutoLaunch();
    this.setupIPC();
  }

  setupAutoLaunch(): void {
    this.autoLauncher = new AutoLaunch({
      name: 'MemoBook',
      path: app.getPath('exe'),
    });
  }

  setupIPC(): void {
    ipcMain.handle('add-todo', async (_, content: string) => {
      return this.database.addTodo(content);
    });

    ipcMain.handle('get-todos', async () => {
      return this.database.getTodos();
    });

    ipcMain.handle('update-todo', async (_, id: number, updates: any) => {
      return this.database.updateTodo(id, updates);
    });

    ipcMain.handle('delete-todo', async (_, id: number) => {
      return this.database.deleteTodo(id);
    });

    ipcMain.handle('play-sound', async (_, soundType: 'add' | 'complete' | 'delete') => {
      this.playSound(soundType);
    });

    ipcMain.handle('get-auto-launch-status', async () => {
      return this.autoLauncher?.isEnabled() || false;
    });

    ipcMain.handle('toggle-auto-launch', async () => {
      if (!this.autoLauncher) return false;

      const isEnabled = await this.autoLauncher.isEnabled();
      if (isEnabled) {
        await this.autoLauncher.disable();
        return false;
      } else {
        await this.autoLauncher.enable();
        return true;
      }
    });
  }

  setupTray(): void {
    const iconPath = path.join(__dirname, '../assets/tray-icon.png');
    const trayIcon = nativeImage.createFromPath(iconPath);

    if (trayIcon.isEmpty()) {
      console.warn('Tray icon not found, using default icon');
    }

    this.tray = new Tray(trayIcon.resize({ width: 16, height: 16 }));

    const contextMenu = Menu.buildFromTemplate([
      {
        label: '开机自启动',
        type: 'checkbox',
        checked: false,
        click: async () => {
          if (this.autoLauncher) {
            const isEnabled = await this.autoLauncher.isEnabled();
            if (isEnabled) {
              await this.autoLauncher.disable();
            } else {
              await this.autoLauncher.enable();
            }
            this.updateTrayMenu();
          }
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
    this.updateTrayMenu();
  }

  async updateTrayMenu(): Promise<void> {
    if (!this.tray || !this.autoLauncher) return;

    const isEnabled = await this.autoLauncher.isEnabled();

    const contextMenu = Menu.buildFromTemplate([
      {
        label: '开机自启动',
        type: 'checkbox',
        checked: isEnabled,
        click: async () => {
          if (this.autoLauncher) {
            const currentStatus = await this.autoLauncher.isEnabled();
            if (currentStatus) {
              await this.autoLauncher.disable();
            } else {
              await this.autoLauncher.enable();
            }
            this.updateTrayMenu();
          }
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
  }

  setupGlobalShortcuts(): void {
    const platform = process.platform;
    const modifier = platform === 'darwin' ? 'Cmd' : 'Ctrl';

    globalShortcut.register(`${modifier}+Alt+Q`, () => {
      this.windowManager.showInputWindow();
    });

    globalShortcut.register(`${modifier}+Alt+P`, () => {
      this.windowManager.toggleListWindow();
    });
  }

  playSound(type: 'add' | 'complete' | 'delete'): void {
    // 这里使用系统声音，后续可以替换为音频文件
    // 由于Electron的音频播放限制，我们在渲染进程中处理
  }

  async initialize(): Promise<void> {
    await app.whenReady();

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
  }

  shutdown(): void {
    this.isQuitting = true;
    globalShortcut.unregisterAll();
    this.database.close();
    app.quit();
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
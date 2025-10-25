import { BrowserWindow, screen } from 'electron';
import * as path from 'path';
import { WindowManager } from '../shared/types';

class WindowManagerService implements WindowManager {
  private inputWindow: BrowserWindow | null = null;
  private listWindow: BrowserWindow | null = null;
  private isListWindowVisible = false;

  showInputWindow(): void {
    if (this.inputWindow) {
      this.inputWindow.focus();
      return;
    }

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
      this.inputWindow?.show();
      this.inputWindow?.focus();
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

  showListWindow(): void {
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

  hideListWindow(): void {
    if (this.listWindow && this.isListWindowVisible) {
      this.listWindow.setBounds({ x: 0, y: -500 });
      this.isListWindowVisible = false;
    }
  }

  toggleListWindow(): void {
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

  private showListWindowContent(): void {
    if (this.listWindow) {
      this.listWindow.setBounds({ x: 0, y: 0 });
      this.listWindow.show();
      this.listWindow.focus();
      this.isListWindowVisible = true;
    }
  }

  isListVisible(): boolean {
    return this.isListWindowVisible;
  }
}

export default WindowManagerService;
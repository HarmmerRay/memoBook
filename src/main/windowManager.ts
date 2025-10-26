import { BrowserWindow, screen } from 'electron';
import * as path from 'path';
import { WindowManager } from '../shared/types';

class WindowManagerService implements WindowManager {
  private inputWindow: BrowserWindow | null = null;
  private listWindow: BrowserWindow | null = null;
  private isListWindowVisible = false;
  private savedListWindowPosition: { x: number; y: number } = { x: 0, y: 0 };

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
      y: 0,
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

    // 设置拖动和悬停检测
    this.listWindow.webContents.on('did-finish-load', () => {
      this.listWindow?.webContents.executeJavaScript(`
        // 让整个窗口可拖动
        document.body.style.webkitAppRegion = 'drag';
        
        // 监听鼠标进入
        document.addEventListener('mouseenter', () => {
          if (window.isHidden) {
            window.electronAPI.showWindow();
          }
        });
      `);
    });

    // 监听窗口键盘事件
    this.listWindow.webContents.on('before-input-event', (_, input) => {
      if (input.key === 'Escape') {
        // ESC 按键直接隐藏（hideListWindow 内部会保存位置）
        this.hideListWindow();
      }
    });

    // 边缘检测
    this.setupEdgeDetection();

    this.listWindow.on('blur', () => {
      this.hideListWindow();
    });

    this.listWindow.on('closed', () => {
      this.listWindow = null;
      this.isListWindowVisible = false;
    });
  }

  setupEdgeDetection(): void {
    if (!this.listWindow) return;

    const checkEdge = setInterval(() => {
      if (!this.listWindow) {
        clearInterval(checkEdge);
        return;
      }

      const bounds = this.listWindow.getBounds();
      
      // 如果窗口顶部接触到屏幕顶部（容差5px）
      if (bounds.y <= 5 && this.isListWindowVisible) {
        // 隐藏窗口（只露出10px）
        this.hideListWindow();
      }

      // 如果窗口隐藏但鼠标悬停在露出的部分，显示窗口
      if (bounds.y < 0 && !this.isListWindowVisible) {
        // 检查鼠标位置，这里简化处理
        // 实际可以通过监听鼠标事件来实现
      }
    }, 100);
  }

  hideListWindow(): void {
    if (this.listWindow && this.isListWindowVisible) {
      // 保存当前位置
      const bounds = this.listWindow.getBounds();
      this.savedListWindowPosition = { x: bounds.x, y: bounds.y };
      
      // 隐藏到顶部（只露出10px）
      const hiddenY = -bounds.height + 10;
      this.listWindow.setBounds({ x: bounds.x, y: hiddenY });
      this.isListWindowVisible = false;
      
      // 通知渲染进程窗口已隐藏
      this.listWindow.webContents.executeJavaScript(`
        window.isHidden = true;
      `).catch(() => {});
    }
  }

  // 新增方法：获取窗口边界
  getWindowBounds(): { x: number; y: number; width: number; height: number } | null {
    if (!this.listWindow) return null;
    return this.listWindow.getBounds();
  }

  toggleListWindow(): void {
    if (!this.listWindow) {
      // 首次创建窗口，使用默认位置或保存的位置
      this.showListWindow();
      setTimeout(() => {
        this.listWindow?.setBounds({ 
          x: this.savedListWindowPosition.x, 
          y: this.savedListWindowPosition.y 
        });
        this.showListWindowContent();
      }, 100);
      return;
    }

    // 切换显示/隐藏
    if (this.isListWindowVisible) {
      // 窗口可见，保存位置并隐藏
      this.hideListWindow();
    } else {
      // 窗口隐藏，在保存的位置显示
      this.showListWindowAtSavedPosition();
    }
  }

  private showListWindowAtSavedPosition(): void {
    if (!this.listWindow) return;
    
    // 先移动到保存的位置（如果位置在上方，则移动到屏幕顶部）
    const displayY = this.savedListWindowPosition.y;
    const finalY = displayY < -10 ? 0 : displayY; // 如果位置在屏幕上方，则回到顶部
    
    this.listWindow.setBounds({ 
      x: this.savedListWindowPosition.x, 
      y: finalY
    });
    this.listWindow.show();
    this.listWindow.focus();
    this.isListWindowVisible = true;
    
    // 通知渲染进程窗口已显示
    this.listWindow.webContents.executeJavaScript(`
      window.isHidden = false;
    `).catch(() => {});
  }

  private showListWindowContent(): void {
    if (this.listWindow) {
      // 使用保存的位置（如果窗口在顶部被隐藏，则恢复到顶部）
      const bounds = this.listWindow.getBounds();
      const visibleY = bounds.y < 0 ? this.savedListWindowPosition.y : bounds.y;
      const visibleX = bounds.y < 0 ? this.savedListWindowPosition.x : bounds.x;
      
      this.listWindow.setBounds({ x: visibleX, y: visibleY });
      this.listWindow.show();
      this.listWindow.focus();
      this.isListWindowVisible = true;
    }
  }

  moveWindow(deltaX: number, deltaY: number): void {
    if (!this.listWindow) return;
    const bounds = this.listWindow.getBounds();
    this.listWindow.setBounds({ x: bounds.x + deltaX, y: bounds.y + deltaY });
  }

  hideWindow(): void {
    this.hideListWindow();
  }

  showWindow(): void {
    if (!this.listWindow) return;
    
    // 通知渲染进程窗口已显示
    this.listWindow.webContents.executeJavaScript(`
      window.isHidden = false;
    `).catch(() => {});
    
    this.showListWindowContent();
  }

  isListVisible(): boolean {
    return this.isListWindowVisible;
  }
}

export default WindowManagerService;
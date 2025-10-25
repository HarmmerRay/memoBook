import React, { useState, useEffect, useRef } from 'react';
import SoundManager from '../soundManager';

const InputWindow: React.FC = () => {
  const [input, setInput] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);
  const soundManager = useRef(new SoundManager());

  useEffect(() => {
    // 自动聚焦到输入框
    inputRef.current?.focus();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (input.trim()) {
      try {
        // 通过 IPC 添加事项
        await window.electronAPI.addTodo(input.trim());
        soundManager.current.playSound('add');

        // 关闭窗口
        window.close();
      } catch (error) {
        console.error('Failed to add todo:', error);
      }
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      window.close();
    }
  };

  return (
    <div style={{
      width: '100%',
      height: '100vh',
      background: 'rgba(30, 30, 30, 0.95)',
      backdropFilter: 'blur(10px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      borderRadius: '12px',
      border: '1px solid rgba(255, 255, 255, 0.1)',
    }}>
      <form onSubmit={handleSubmit} style={{
        width: '90%',
        maxWidth: '350px',
      }}>
        <input
          ref={inputRef}
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="输入事项内容..."
          style={{
            width: '100%',
            padding: '16px',
            fontSize: '16px',
            border: 'none',
            borderRadius: '8px',
            background: 'rgba(255, 255, 255, 0.9)',
            outline: 'none',
            boxSizing: 'border-box',
          }}
          autoFocus
        />
        <div style={{
          fontSize: '12px',
          color: 'rgba(255, 255, 255, 0.6)',
          textAlign: 'center',
          marginTop: '12px',
        }}>
          按 Enter 添加 • 按 ESC 取消
        </div>
      </form>
    </div>
  );
};

export default InputWindow;
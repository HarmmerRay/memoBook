import React, { useState, useEffect, useRef } from 'react';
import { Todo } from '../../shared/types';
import SoundManager from '../soundManager';

const TodoList: React.FC = () => {
  const [todos, setTodos] = useState<Todo[]>([]);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editText, setEditText] = useState('');
  const [isDragging, setIsDragging] = useState(false);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isHidden, setIsHidden] = useState(false);
  const listRef = useRef<HTMLDivElement>(null);
  const soundManager = useRef(new SoundManager());
  const dragRef = useRef({ startX: 0, startY: 0, windowStartX: 0, windowStartY: 0 });

  useEffect(() => {
    loadTodos();
  }, []);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (isDragging) {
        handleDrag(e);
      }
    };

    const handleMouseUp = () => {
      if (isDragging) {
        handleDragEnd();
      }
    };

    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging]);

  const handleMouseDown = async (e: React.MouseEvent) => {
    if (e.currentTarget === e.target || (e.target as HTMLElement).closest('.drag-handle')) {
      const bounds = await window.electronAPI.getWindowBounds();
      if (bounds) {
        setIsDragging(true);
        dragRef.current = {
          startX: e.screenX,
          startY: e.screenY,
          windowStartX: bounds.x,
          windowStartY: bounds.y
        };
        e.preventDefault();
      }
    }
  };

  const handleDrag = async (e: MouseEvent) => {
    const deltaX = e.screenX - dragRef.current.startX;
    const deltaY = e.screenY - dragRef.current.startY;
    const newX = dragRef.current.windowStartX + deltaX;
    const newY = dragRef.current.windowStartY + deltaY;

    try {
      const bounds = await window.electronAPI.getWindowBounds();
      if (bounds) {
        const windowHeight = bounds.height;

        // Move window to new position
        await window.electronAPI.moveWindow(newX, newY);

        // Check if window is at screen top edge
        if (newY <= 0) {
          if (!isHidden) {
            setIsHidden(true);
            // Hide window above screen
            await window.electronAPI.moveWindow(newX, -windowHeight + 10); // Leave 10px visible for hover detection
          }
        } else {
          if (isHidden) {
            setIsHidden(false);
          }
        }

        setPosition({ x: newX, y: newY });
      }
    } catch (error) {
      console.error('Failed to move window:', error);
    }
  };

  const handleDragEnd = () => {
    setIsDragging(false);
  };

  const handleMouseEnter = async () => {
    if (isHidden) {
      setIsHidden(false);
      await window.electronAPI.moveWindow(position.x, 0);
    }
  };

  const loadTodos = async () => {
    try {
      const todosData = await window.electronAPI.getTodos();
      setTodos(todosData);
    } catch (error) {
      console.error('Failed to load todos:', error);
    }
  };

  const handleToggleComplete = async (todo: Todo) => {
    try {
      const newStatus = todo.status === 'completed' ? 'pending' : 'completed';
      await window.electronAPI.updateTodo(todo.id, { status: newStatus });

      soundManager.current.playSound('complete');
      loadTodos();
    } catch (error) {
      console.error('Failed to toggle todo:', error);
    }
  };

  const handleDelete = async (id: number) => {
    try {
      await window.electronAPI.deleteTodo(id);
      soundManager.current.playSound('delete');
      loadTodos();
    } catch (error) {
      console.error('Failed to delete todo:', error);
    }
  };

  const handleStartEdit = (todo: Todo) => {
    setEditingId(todo.id);
    setEditText(todo.content);
  };

  const handleSaveEdit = async () => {
    if (editingId !== null && editText.trim()) {
      try {
        await window.electronAPI.updateTodo(editingId, { content: editText.trim() });
        setEditingId(null);
        setEditText('');
        loadTodos();
      } catch (error) {
        console.error('Failed to update todo:', error);
      }
    }
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setEditText('');
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      window.close();
    }
  };

  return (
    <div
      ref={listRef}
      onKeyDown={handleKeyDown}
      tabIndex={0}
      onMouseDown={handleMouseDown}
      onMouseEnter={handleMouseEnter}
      style={{
        width: '100%',
        height: '100vh',
        background: 'rgba(30, 30, 30, 0.95)',
        backdropFilter: 'blur(10px)',
        borderRadius: '0 0 12px 0',
        border: '1px solid rgba(255, 255, 255, 0.1)',
        borderTop: 'none',
        borderLeft: 'none',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
        cursor: isDragging ? 'grabbing' : 'default',
        userSelect: isDragging ? 'none' : 'auto',
      }}
    >
      <div
        className="drag-handle"
        style={{
          padding: '16px',
          borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
          color: 'white',
          fontSize: '14px',
          fontWeight: 'bold',
          cursor: 'grab',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}
      >
        <span>事项列表</span>
        <span style={{
          fontSize: '10px',
          color: 'rgba(255, 255, 255, 0.5)',
          cursor: 'grab'
        }}>
          ⋮⋮ 拖动
        </span>
      </div>

      <div style={{
        flex: 1,
        overflowY: 'auto',
        padding: '8px',
      }}>
        {todos.length === 0 ? (
          <div style={{
            color: 'rgba(255, 255, 255, 0.5)',
            textAlign: 'center',
            padding: '20px',
            fontSize: '14px',
          }}>
            暂无事项
          </div>
        ) : (
          todos.map((todo) => (
            <div
              key={todo.id}
              style={{
                padding: '12px',
                marginBottom: '4px',
                background: 'rgba(255, 255, 255, 0.05)',
                borderRadius: '6px',
                border: '1px solid rgba(255, 255, 255, 0.1)',
              }}
            >
              {editingId === todo.id ? (
                <div style={{ display: 'flex', gap: '4px' }}>
                  <input
                    type="text"
                    value={editText}
                    onChange={(e) => setEditText(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') handleSaveEdit();
                      if (e.key === 'Escape') handleCancelEdit();
                    }}
                    style={{
                      flex: 1,
                      padding: '4px 8px',
                      border: '1px solid rgba(255, 255, 255, 0.3)',
                      borderRadius: '4px',
                      background: 'rgba(255, 255, 255, 0.9)',
                      fontSize: '13px',
                      outline: 'none',
                    }}
                    autoFocus
                  />
                  <button
                    onClick={handleSaveEdit}
                    style={{
                      padding: '4px 8px',
                      background: 'rgba(52, 152, 219, 0.8)',
                      color: 'white',
                      border: 'none',
                      borderRadius: '4px',
                      fontSize: '12px',
                      cursor: 'pointer',
                    }}
                  >
                    保存
                  </button>
                  <button
                    onClick={handleCancelEdit}
                    style={{
                      padding: '4px 8px',
                      background: 'rgba(149, 165, 166, 0.8)',
                      color: 'white',
                      border: 'none',
                      borderRadius: '4px',
                      fontSize: '12px',
                      cursor: 'pointer',
                    }}
                  >
                    取消
                  </button>
                </div>
              ) : (
                <div>
                  <div
                    onDoubleClick={() => handleStartEdit(todo)}
                    style={{
                      color: todo.status === 'completed' ? 'rgba(255, 255, 255, 0.5)' : 'white',
                      textDecoration: todo.status === 'completed' ? 'line-through' : 'none',
                      fontSize: '14px',
                      lineHeight: '1.4',
                      cursor: 'pointer',
                      marginBottom: '8px',
                    }}
                  >
                    {todo.content}
                  </div>
                  <div style={{
                    display: 'flex',
                    gap: '8px',
                    alignItems: 'center',
                  }}>
                    <button
                      onClick={() => handleToggleComplete(todo)}
                      style={{
                        padding: '2px 6px',
                        background: todo.status === 'completed'
                          ? 'rgba(46, 204, 113, 0.8)'
                          : 'rgba(149, 165, 166, 0.8)',
                        color: 'white',
                        border: 'none',
                        borderRadius: '3px',
                        fontSize: '11px',
                        cursor: 'pointer',
                      }}
                    >
                      {todo.status === 'completed' ? '已完成' : '待办'}
                    </button>
                    <button
                      onClick={() => handleDelete(todo.id)}
                      style={{
                        padding: '2px 6px',
                        background: 'rgba(231, 76, 60, 0.8)',
                        color: 'white',
                        border: 'none',
                        borderRadius: '3px',
                        fontSize: '11px',
                        cursor: 'pointer',
                      }}
                    >
                      删除
                    </button>
                    <div style={{
                      fontSize: '10px',
                      color: 'rgba(255, 255, 255, 0.4)',
                      marginLeft: 'auto',
                    }}>
                      {new Date(todo.createdDate).toLocaleDateString()}
                    </div>
                  </div>
                </div>
              )}
            </div>
          ))
        )}
      </div>

      <div style={{
        padding: '8px',
        borderTop: '1px solid rgba(255, 255, 255, 0.1)',
        color: 'rgba(255, 255, 255, 0.5)',
        fontSize: '10px',
        textAlign: 'center',
      }}>
        双击编辑 • ESC 关闭
      </div>
    </div>
  );
};

export default TodoList;
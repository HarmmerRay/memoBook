import React from 'react';
import { createRoot } from 'react-dom/client';
import InputWindow from './components/InputWindow';
import TodoList from './components/TodoList';
import './global';

const App: React.FC = () => {
  // 根据 URL hash 显示不同的组件
  const hash = window.location.hash.substring(1);

  if (hash === 'input') {
    return <InputWindow />;
  } else if (hash === 'list') {
    return <TodoList />;
  }

  // 默认情况下不显示任何内容
  return null;
};

const container = document.getElementById('root');
if (container) {
  const root = createRoot(container);
  root.render(<App />);
}
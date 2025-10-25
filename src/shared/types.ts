export interface Todo {
  id: number;
  content: string;
  createdDate: string;
  status: 'pending' | 'completed' | 'deleted';
}

export interface DatabaseService {
  addTodo(content: string): Todo;
  getTodos(): Todo[];
  updateTodo(id: number, updates: Partial<Todo>): boolean;
  deleteTodo(id: number): boolean;
}

export interface WindowManager {
  showInputWindow(): void;
  showListWindow(): void;
  hideListWindow(): void;
  toggleListWindow(): void;
}
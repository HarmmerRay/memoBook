import Database from 'better-sqlite3';
import * as path from 'path';
import { app } from 'electron';
import { Todo, DatabaseService } from '../shared/types';

class SQLiteDatabaseService implements DatabaseService {
  private db: Database.Database;

  constructor() {
    const dbPath = path.join(app.getPath('userData'), 'todos.db');
    this.db = new Database(dbPath);
    this.initDatabase();
  }

  private initDatabase(): void {
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS todos (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        content TEXT NOT NULL,
        createdDate TEXT NOT NULL,
        status TEXT NOT NULL DEFAULT 'pending'
      )
    `);
  }

  addTodo(content: string): Todo {
    const stmt = this.db.prepare(`
      INSERT INTO todos (content, createdDate, status)
      VALUES (?, ?, 'pending')
    `);

    const result = stmt.run(content, new Date().toISOString());

    return this.getTodoById(result.lastInsertRowid as number);
  }

  getTodos(): Todo[] {
    const stmt = this.db.prepare(`
      SELECT * FROM todos
      WHERE status != 'deleted'
      ORDER BY createdDate ASC
    `);

    return stmt.all() as Todo[];
  }

  updateTodo(id: number, updates: Partial<Todo>): boolean {
    const fields = Object.keys(updates).filter(key => key !== 'id');
    if (fields.length === 0) return false;

    const setClause = fields.map(field => `${field} = ?`).join(', ');
    const values = fields.map(field => updates[field as keyof Todo]);

    const stmt = this.db.prepare(`
      UPDATE todos SET ${setClause} WHERE id = ?
    `);

    const result = stmt.run(...values, id);
    return result.changes > 0;
  }

  deleteTodo(id: number): boolean {
    return this.updateTodo(id, { status: 'deleted' });
  }

  private getTodoById(id: number): Todo {
    const stmt = this.db.prepare('SELECT * FROM todos WHERE id = ?');
    return stmt.get(id) as Todo;
  }

  close(): void {
    this.db.close();
  }
}

export default SQLiteDatabaseService;
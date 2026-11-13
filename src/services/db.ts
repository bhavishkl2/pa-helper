import { CapacitorSQLite, SQLiteDBConnection } from '@capacitor-community/sqlite';

const DB_NAME = 'upi_balance_tracker_db';
const DB_ENCRYPTED = false;
const DB_MODE = 'no-encryption';
const DB_VERSION = 1;
const DB_READONLY = false;

const sqlite = CapacitorSQLite as any;

let db: SQLiteDBConnection | null = null;

const SCHEMA = `
CREATE TABLE IF NOT EXISTS accounts (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  type TEXT NOT NULL DEFAULT 'savings',
  opening_balance REAL NOT NULL DEFAULT 0,
  current_balance REAL NOT NULL DEFAULT 0,
  currency TEXT NOT NULL DEFAULT 'INR',
  color TEXT NOT NULL DEFAULT '#3B82F6',
  icon TEXT NOT NULL DEFAULT 'wallet',
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS transactions (
  id TEXT PRIMARY KEY,
  account_id TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('income','expense','transfer')),
  amount REAL NOT NULL,
  currency TEXT NOT NULL DEFAULT 'INR',
  direction TEXT NOT NULL DEFAULT 'credit',
  upi_app TEXT,
  sender TEXT,
  receiver TEXT,
  reference TEXT,
  note TEXT,
  status TEXT NOT NULL DEFAULT 'completed',
  timestamp INTEGER NOT NULL,
  is_manual INTEGER NOT NULL DEFAULT 0,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL,
  FOREIGN KEY (account_id) REFERENCES accounts(id)
);

CREATE TABLE IF NOT EXISTS transfers (
  id TEXT PRIMARY KEY,
  from_account_id TEXT NOT NULL,
  to_account_id TEXT NOT NULL,
  amount REAL NOT NULL,
  timestamp INTEGER NOT NULL,
  note TEXT,
  created_at INTEGER NOT NULL,
  FOREIGN KEY (from_account_id) REFERENCES accounts(id),
  FOREIGN KEY (to_account_id) REFERENCES accounts(id)
);

CREATE INDEX IF NOT EXISTS idx_transactions_account ON transactions(account_id);
CREATE INDEX IF NOT EXISTS idx_transactions_timestamp ON transactions(timestamp);
CREATE INDEX IF NOT EXISTS idx_transactions_reference ON transactions(reference);
`;

export const nowMs = () => Date.now();

export const initDb = async (): Promise<void> => {
  try {
    const connection = sqlite.createConnection(DB_NAME, DB_ENCRYPTED, DB_MODE, DB_VERSION, DB_READONLY);
    await connection.open();
    await connection.execute({ statements: SCHEMA });
    db = connection;
  } catch (err: any) {
    if (db) return;
    const connection = sqlite.createConnection(DB_NAME, DB_ENCRYPTED, DB_MODE, DB_VERSION, DB_READONLY);
    await connection.open();
    db = connection;
  }
};

export const getDb = (): SQLiteDBConnection => {
  if (!db) throw new Error('Database not initialized');
  return db;
};

export const closeDb = async (): Promise<void> => {
  if (db) {
    try { await db.close(); } catch {}
    db = null;
  }
};

export type Account = {
  id: string;
  name: string;
  type: string;
  opening_balance: number;
  current_balance: number;
  currency: string;
  color: string;
  icon: string;
  created_at: number;
  updated_at: number;
};

export type Transaction = {
  id: string;
  account_id: string;
  type: string;
  amount: number;
  currency: string;
  direction: string;
  upi_app?: string | null;
  sender?: string | null;
  receiver?: string | null;
  reference?: string | null;
  note?: string | null;
  status: string;
  timestamp: number;
  is_manual: number;
  created_at: number;
  updated_at: number;
};

export const accountQueries = {
  list: async (): Promise<Account[]> => {
    const res = await getDb().query({ statement: 'SELECT * FROM accounts ORDER BY name ASC', values: [] });
    return (res.values as Account[]) || [];
  },
  get: async (id: string): Promise<Account | null> => {
    const res = await getDb().query({ statement: 'SELECT * FROM accounts WHERE id = ?', values: [id] });
    const rows = (res.values as Account[]) || [];
    return rows[0] || null;
  },
  create: async (acc: Omit<Account, 'id' | 'created_at' | 'updated_at'>): Promise<string> => {
    const id = crypto.randomUUID();
    const ts = nowMs();
    await getDb().run({
      statement: `INSERT INTO accounts (id,name,type,opening_balance,current_balance,currency,color,icon,created_at,updated_at) VALUES (?,?,?,?,?,?,?,?,?,?)`,
      values: [id, acc.name, acc.type, acc.opening_balance, acc.opening_balance, acc.currency, acc.color, acc.icon, ts, ts],
    });
    return id;
  },
  update: async (id: string, fields: Partial<Account>): Promise<void> => {
    const keys = Object.keys(fields);
    const set = keys.map((k) => `${k} = ?`).join(', ');
    const values = [...keys.map((k) => fields[k as keyof Account]), nowMs(), id];
    await getDb().run({ statement: `UPDATE accounts SET ${set}, updated_at = ? WHERE id = ?`, values });
  },
  updateBalance: async (id: string, amount: number, type: 'income' | 'expense'): Promise<void> => {
    const acc = await accountQueries.get(id);
    if (!acc) return;
    const newBalance = type === 'income' ? acc.current_balance + amount : acc.current_balance - amount;
    await accountQueries.update(id, { current_balance: newBalance });
  },
  delete: async (id: string): Promise<void> => {
    await getDb().run({ statement: 'DELETE FROM accounts WHERE id = ?', values: [id] });
  },
};

export const transactionQueries = {
  list: async (): Promise<Transaction[]> => {
    const res = await getDb().query({ statement: 'SELECT * FROM transactions ORDER BY timestamp DESC, created_at DESC', values: [] });
    return (res.values as Transaction[]) || [];
  },
  get: async (id: string): Promise<Transaction | null> => {
    const res = await getDb().query({ statement: 'SELECT * FROM transactions WHERE id = ?', values: [id] });
    const rows = (res.values as Transaction[]) || [];
    return rows[0] || null;
  },
  existsByReference: async (reference: string | null): Promise<boolean> => {
    if (!reference) return false;
    const res = await getDb().query({ statement: 'SELECT 1 FROM transactions WHERE reference = ? LIMIT 1', values: [reference] });
    return Boolean((res.values as any[])?.length);
  },
  create: async (tx: Omit<Transaction, 'id' | 'created_at' | 'updated_at'>): Promise<string> => {
    const id = crypto.randomUUID();
    const ts = nowMs();
    await getDb().run({
      statement: `INSERT INTO transactions (id,account_id,type,amount,currency,direction,upi_app,sender,receiver,reference,note,status,timestamp,is_manual,created_at,updated_at) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`,
      values: [id, tx.account_id, tx.type, tx.amount, tx.currency, tx.direction, tx.upi_app ?? null, tx.sender ?? null, tx.receiver ?? null, tx.reference ?? null, tx.note ?? null, tx.status, tx.timestamp, tx.is_manual, ts, ts],
    });
    return id;
  },
  update: async (id: string, fields: Partial<Transaction>): Promise<void> => {
    const keys = Object.keys(fields);
    const set = keys.map((k) => `${k} = ?`).join(', ');
    const values = [...keys.map((k) => fields[k as keyof Transaction]), nowMs(), id];
    await getDb().run({ statement: `UPDATE transactions SET ${set}, updated_at = ? WHERE id = ?`, values });
  },
  delete: async (id: string): Promise<void> => {
    await getDb().run({ statement: 'DELETE FROM transactions WHERE id = ?', values: [id] });
  },
  summary: async (): Promise<{ income: number; expense: number; count: number }> => {
    const res = await getDb().query({
      statement: `SELECT type, SUM(amount) as total, COUNT(*) as cnt FROM transactions GROUP BY type`,
      values: [],
    });
    const rows = (res.values as any[]) || [];
    let income = 0, expense = 0, count = 0;
    for (const r of rows) {
      count += Number(r.cnt || 0);
      if (r.type === 'income') income = Number(r.total || 0);
      if (r.type === 'expense') expense = Number(r.total || 0);
    }
    return { income, expense, count };
  },
};

export const transferQueries = {
  list: async () => {
    const res = await getDb().query({ statement: 'SELECT * FROM transfers ORDER BY timestamp DESC', values: [] });
    return (res.values as any[]) || [];
  },
  create: async (t: { from_account_id: string; to_account_id: string; amount: number; note?: string; timestamp?: number }) => {
    const id = crypto.randomUUID();
    const ts = t.timestamp ?? nowMs();
    await getDb().run({
      statement: `INSERT INTO transfers (id,from_account_id,to_account_id,amount,timestamp,note,created_at) VALUES (?,?,?,?,?,?,?)`,
      values: [id, t.from_account_id, t.to_account_id, t.amount, ts, t.note ?? null, ts],
    });
    return id;
  },
};

export { DB_NAME };

import * as SQLite from 'expo-sqlite';

export interface LocalMessage {
  id: string;
  chat_room_id: string;
  sender_id: string;
  content: string;
  message_type: string;
  file_url: string | null;
  reply_to: string | null;
  is_edited: boolean;
  created_at: string;
  updated_at: string;
  synced: boolean; // Track sync status
  local_id?: string; // For offline-created messages
}

export interface LocalTeam {
  id: string;
  company_id: string | null;
  name: string;
  description: string | null;
  color: string;
  created_at: string;
  updated_at: string;
  synced: boolean;
}

export interface LocalChatRoom {
  id: string;
  company_id: string | null;
  team_id: string | null;
  name: string;
  description: string | null;
  type: string;
  department: string | null;
  is_private: boolean;
  auto_join_department: string | null;
  auto_join_team: boolean;
  created_by: string | null;
  created_at: string;
  updated_at: string;
  synced: boolean;
}

export interface SyncMetadata {
  id: number;
  table_name: string;
  last_sync: string;
}

class DatabaseService {
  private db: SQLite.SQLiteDatabase | null = null;

  async initialize(): Promise<void> {
    try {
      this.db = await SQLite.openDatabaseAsync('skiftappen.db');
      await this.createTables();
      console.log('Database initialized successfully');
    } catch (error) {
      console.error('Failed to initialize database:', error);
      throw error;
    }
  }

  private async createTables(): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');

    // Create messages table
    await this.db.execAsync(`
      CREATE TABLE IF NOT EXISTS messages (
        id TEXT PRIMARY KEY,
        chat_room_id TEXT NOT NULL,
        sender_id TEXT NOT NULL,
        content TEXT NOT NULL,
        message_type TEXT DEFAULT 'text',
        file_url TEXT,
        reply_to TEXT,
        is_edited BOOLEAN DEFAULT 0,
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL,
        synced BOOLEAN DEFAULT 0,
        local_id TEXT
      );
    `);

    // Create teams table
    await this.db.execAsync(`
      CREATE TABLE IF NOT EXISTS teams (
        id TEXT PRIMARY KEY,
        company_id TEXT,
        name TEXT NOT NULL,
        description TEXT,
        color TEXT DEFAULT '#007AFF',
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL,
        synced BOOLEAN DEFAULT 0
      );
    `);

    // Create chat_rooms table
    await this.db.execAsync(`
      CREATE TABLE IF NOT EXISTS chat_rooms (
        id TEXT PRIMARY KEY,
        company_id TEXT,
        team_id TEXT,
        name TEXT NOT NULL,
        description TEXT,
        type TEXT DEFAULT 'general',
        department TEXT,
        is_private BOOLEAN DEFAULT 0,
        auto_join_department TEXT,
        auto_join_team BOOLEAN DEFAULT 0,
        created_by TEXT,
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL,
        synced BOOLEAN DEFAULT 0
      );
    `);

    // Create sync metadata table
    await this.db.execAsync(`
      CREATE TABLE IF NOT EXISTS sync_metadata (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        table_name TEXT UNIQUE NOT NULL,
        last_sync TEXT NOT NULL
      );
    `);

    // Create indexes for performance
    await this.db.execAsync(`
      CREATE INDEX IF NOT EXISTS idx_messages_chat_room_id ON messages(chat_room_id);
      CREATE INDEX IF NOT EXISTS idx_messages_created_at ON messages(created_at);
      CREATE INDEX IF NOT EXISTS idx_messages_synced ON messages(synced);
      CREATE INDEX IF NOT EXISTS idx_teams_company_id ON teams(company_id);
      CREATE INDEX IF NOT EXISTS idx_chat_rooms_company_id ON chat_rooms(company_id);
      CREATE INDEX IF NOT EXISTS idx_chat_rooms_team_id ON chat_rooms(team_id);
    `);
  }

  // Message operations
  async getMessages(chatRoomId: string): Promise<LocalMessage[]> {
    if (!this.db) throw new Error('Database not initialized');

    const result = await this.db.getAllAsync(
      'SELECT * FROM messages WHERE chat_room_id = ? ORDER BY created_at ASC',
      [chatRoomId]
    );

    return result as LocalMessage[];
  }

  async insertMessage(message: Omit<LocalMessage, 'synced'>): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');

    await this.db.runAsync(
      `INSERT OR REPLACE INTO messages 
       (id, chat_room_id, sender_id, content, message_type, file_url, reply_to, is_edited, created_at, updated_at, synced, local_id)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        message.id,
        message.chat_room_id,
        message.sender_id,
        message.content,
        message.message_type,
        message.file_url,
        message.reply_to,
        message.is_edited ? 1 : 0,
        message.created_at,
        message.updated_at,
        0, // synced = false initially
        message.local_id || null
      ]
    );
  }

  async getUnsyncedMessages(): Promise<LocalMessage[]> {
    if (!this.db) throw new Error('Database not initialized');

    const result = await this.db.getAllAsync(
      'SELECT * FROM messages WHERE synced = 0 ORDER BY created_at ASC'
    );

    return result as LocalMessage[];
  }

  async markMessageAsSynced(id: string): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');

    await this.db.runAsync(
      'UPDATE messages SET synced = 1 WHERE id = ?',
      [id]
    );
  }

  // Team operations
  async getTeams(companyId?: string): Promise<LocalTeam[]> {
    if (!this.db) throw new Error('Database not initialized');

    let query = 'SELECT * FROM teams';
    let params: any[] = [];

    if (companyId) {
      query += ' WHERE company_id = ?';
      params = [companyId];
    }

    query += ' ORDER BY name ASC';

    const result = await this.db.getAllAsync(query, params);
    return result as LocalTeam[];
  }

  async insertTeam(team: Omit<LocalTeam, 'synced'>): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');

    await this.db.runAsync(
      `INSERT OR REPLACE INTO teams 
       (id, company_id, name, description, color, created_at, updated_at, synced)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        team.id,
        team.company_id,
        team.name,
        team.description,
        team.color,
        team.created_at,
        team.updated_at,
        0 // synced = false initially
      ]
    );
  }

  async getUnsyncedTeams(): Promise<LocalTeam[]> {
    if (!this.db) throw new Error('Database not initialized');

    const result = await this.db.getAllAsync(
      'SELECT * FROM teams WHERE synced = 0'
    );

    return result as LocalTeam[];
  }

  async markTeamAsSynced(id: string): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');

    await this.db.runAsync(
      'UPDATE teams SET synced = 1 WHERE id = ?',
      [id]
    );
  }

  // Chat room operations
  async getChatRooms(companyId?: string): Promise<LocalChatRoom[]> {
    if (!this.db) throw new Error('Database not initialized');

    let query = 'SELECT * FROM chat_rooms';
    let params: any[] = [];

    if (companyId) {
      query += ' WHERE company_id = ?';
      params = [companyId];
    }

    query += ' ORDER BY name ASC';

    const result = await this.db.getAllAsync(query, params);
    return result as LocalChatRoom[];
  }

  async insertChatRoom(chatRoom: Omit<LocalChatRoom, 'synced'>): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');

    await this.db.runAsync(
      `INSERT OR REPLACE INTO chat_rooms 
       (id, company_id, team_id, name, description, type, department, is_private, auto_join_department, auto_join_team, created_by, created_at, updated_at, synced)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        chatRoom.id,
        chatRoom.company_id,
        chatRoom.team_id,
        chatRoom.name,
        chatRoom.description,
        chatRoom.type,
        chatRoom.department,
        chatRoom.is_private ? 1 : 0,
        chatRoom.auto_join_department,
        chatRoom.auto_join_team ? 1 : 0,
        chatRoom.created_by,
        chatRoom.created_at,
        chatRoom.updated_at,
        0 // synced = false initially
      ]
    );
  }

  // Sync metadata operations
  async getLastSyncTime(tableName: string): Promise<string | null> {
    if (!this.db) throw new Error('Database not initialized');

    const result = await this.db.getFirstAsync(
      'SELECT last_sync FROM sync_metadata WHERE table_name = ?',
      [tableName]
    ) as { last_sync: string } | null;

    return result?.last_sync || null;
  }

  async updateLastSyncTime(tableName: string, timestamp: string): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');

    await this.db.runAsync(
      `INSERT OR REPLACE INTO sync_metadata (table_name, last_sync)
       VALUES (?, ?)`,
      [tableName, timestamp]
    );
  }

  // Utility methods
  async clearAllData(): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');

    await this.db.execAsync(`
      DELETE FROM messages;
      DELETE FROM teams;
      DELETE FROM chat_rooms;
      DELETE FROM sync_metadata;
    `);
  }

  async close(): Promise<void> {
    if (this.db) {
      await this.db.closeAsync();
      this.db = null;
    }
  }
}

export const databaseService = new DatabaseService();
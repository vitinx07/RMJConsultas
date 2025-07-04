// Storage interface for future use
// Currently not used as the app works with external APIs

export interface IStorage {
  // Interface for future storage needs
}

export class MemStorage implements IStorage {
  constructor() {
    // In-memory storage for future use
  }
}

export const storage = new MemStorage();

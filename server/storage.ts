import {
  users,
  sessions,
  type User,
  type CreateUser,
  type UpdateUser,
} from "@shared/schema";
import { db } from "./db";
import { eq, and } from "drizzle-orm";
import bcrypt from "bcryptjs";

export interface IStorage {
  // User operations
  getUserById(id: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(userData: CreateUser, creatorId?: string): Promise<User>;
  updateUser(id: string, userData: UpdateUser): Promise<User | undefined>;
  deleteUser(id: string): Promise<boolean>;
  getAllUsers(): Promise<User[]>;
  validateCredentials(username: string, password: string): Promise<User | null>;
  createAdminUser(): Promise<void>;
}

export class DatabaseStorage implements IStorage {
  async getUserById(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user;
  }

  async createUser(userData: CreateUser, creatorId?: string): Promise<User> {
    const hashedPassword = await bcrypt.hash(userData.password, 10);
    
    const [user] = await db
      .insert(users)
      .values({
        ...userData,
        passwordHash: hashedPassword,
        createdBy: creatorId,
        updatedAt: new Date(),
      })
      .returning();
    
    return user;
  }

  async updateUser(id: string, userData: UpdateUser): Promise<User | undefined> {
    const [user] = await db
      .update(users)
      .set({
        ...userData,
        updatedAt: new Date(),
      })
      .where(eq(users.id, id))
      .returning();
    
    return user;
  }

  async deleteUser(id: string): Promise<boolean> {
    const result = await db.delete(users).where(eq(users.id, id));
    return (result.rowCount ?? 0) > 0;
  }

  async getAllUsers(): Promise<User[]> {
    return await db.select().from(users);
  }

  async validateCredentials(username: string, password: string): Promise<User | null> {
    const user = await this.getUserByUsername(username);
    if (!user || !user.isActive) {
      return null;
    }

    const isValidPassword = await bcrypt.compare(password, user.passwordHash);
    return isValidPassword ? user : null;
  }

  async createAdminUser(): Promise<void> {
    // Check if admin user already exists
    const existingAdmin = await this.getUserByUsername("Vitor.admin");
    if (existingAdmin) {
      return;
    }

    // Create the default admin user
    await this.createUser({
      username: "Vitor.admin",
      password: "admin",
      confirmPassword: "admin",
      role: "administrator",
      firstName: "Vitor",
      lastName: "Administrator",
      email: "admin@system.com",
      isActive: true,
    });
  }
}

export const storage = new DatabaseStorage();

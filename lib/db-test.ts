// lib/db-test.ts
// Utility to test database connection
import mysql from 'mysql2/promise'
import { db } from './db'

export interface DbConnectionStatus {
  connected: boolean
  error?: string
  code?: string
  host?: string
  database?: string
  message?: string
}

export async function testDbConnection(): Promise<DbConnectionStatus> {
  try {
    // Try a simple query to test the connection
    const result = await db.query('SELECT 1 as test')
    
    return {
      connected: true,
      host: process.env.DB_HOST,
      database: process.env.DB_NAME,
      message: 'Database connection successful'
    }
  } catch (error: any) {
    return {
      connected: false,
      error: error.message || 'Unknown error',
      code: error.code,
      host: process.env.DB_HOST,
      database: process.env.DB_NAME,
      message: `Database connection failed: ${error.message}`
    }
  }
}

export async function getDbConfig() {
  return {
    host: process.env.DB_HOST || 'Not set',
    user: process.env.DB_USER || 'Not set',
    database: process.env.DB_NAME || 'Not set',
    port: process.env.DB_PORT || '3306',
    hasPassword: !!process.env.DB_PASSWORD
  }
}


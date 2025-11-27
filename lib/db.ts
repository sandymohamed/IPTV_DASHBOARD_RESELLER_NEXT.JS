// // lib/db.ts
// import mysql from 'mysql2/promise'

// export async function getDbConnection() {
//   return await mysql.createConnection({
//     host: process.env.DB_HOST,
//     user: process.env.DB_USER,
//     password: process.env.DB_PASSWORD,
//     database: process.env.DB_NAME,
//   })
// }

// export const db = {
//   async query(sql: string, params: any[] = []) {
//     const connection = await getDbConnection()
//     try {
//       const [rows] = await connection.execute(sql, params)
//       return [rows]
//     } finally {
//       await connection.end()
//     }
//   }
// }



// lib/db.ts
import mysql from 'mysql2/promise'

// Use global to persist pool across module boundaries (Next.js hot reload)
declare global {
  var __dbPool: mysql.Pool | undefined;
  var __dbPoolInitialized: boolean | undefined;
}

// Database connection pool for better performance
function createPool(): mysql.Pool {
  // Use global pool if available (survives Next.js hot reloads)
  if (global.__dbPool) {
    return global.__dbPool;
  }

  const dbConfig = {
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    port: process.env.DB_PORT ? parseInt(process.env.DB_PORT) : 7999,
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0,
    // Performance optimizations
    enableKeepAlive: true,
    keepAliveInitialDelay: 0,
    acquireTimeout: 60000,
    timeout: 60000,
  }
  
  // Only log once on first pool creation
  if (!global.__dbPoolInitialized) {
    if (process.env.NODE_ENV === 'development') {
      console.log('🔌 Initializing database connection pool:', {
        host: dbConfig.host,
        database: dbConfig.database,
      })
    }
    global.__dbPoolInitialized = true;
  }
  
  const pool = mysql.createPool(dbConfig)
  global.__dbPool = pool;
  
  // Test the connection once on pool creation (non-blocking)
  pool.getConnection()
    .then((connection) => {
      if (process.env.NODE_ENV === 'development' && global.__dbPoolInitialized) {
        console.log('✅ Database connection pool initialized successfully!')
      }
      connection.release()
    })
    .catch((error) => {
      console.error('❌ Database connection failed:', {
        code: error.code,
        message: error.message,
        host: dbConfig.host,
        database: dbConfig.database
      })
    })

  return pool;
}

export async function getDbConnection(): Promise<mysql.PoolConnection> {
  const pool = createPool()
  return await pool.getConnection()
}

export const db = {
  async query(sql: string, params: any[] = []) {
    const connection = await getDbConnection()
    try {
      const [rows] = await connection.execute(sql, params)
      return rows
    } finally {
      connection.release() // Release back to pool instead of closing
    }
  },

  async queryWithConnection(connection: mysql.PoolConnection, sql: string, params: any[] = []) {
    const [rows] = await connection.execute(sql, params)
    return rows
  }
}
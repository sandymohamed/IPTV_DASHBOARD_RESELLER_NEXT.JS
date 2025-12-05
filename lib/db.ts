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
  }
  
  // Only initialize once
  if (!global.__dbPoolInitialized) {
    global.__dbPoolInitialized = true;
  }
  
  const pool = mysql.createPool(dbConfig)
  global.__dbPool = pool;
  
  // Test the connection once on pool creation (non-blocking, no logging)
  pool.getConnection()
    .then((connection) => {
      connection.release()
    })
    .catch(() => {
      // Silently fail - connection will be retried on next query
    })

  return pool;
}

export async function getDbConnection(): Promise<mysql.PoolConnection> {
  const pool = createPool()
  return await pool.getConnection()
}

export const db = {
  async query(sql: string, params: any[] = [], retries = 3): Promise<any> {
    let lastError: Error | null = null;
    
    for (let attempt = 1; attempt <= retries; attempt++) {
      let connection: mysql.PoolConnection | null = null;
      try {
        // Check if pool exists and is not closed
        if (!global.__dbPool) {
          // Pool was destroyed, recreate it
          createPool();
        }
        
        connection = await getDbConnection();
        
        // Execute query directly (pool handles connection health)
        const [rows] = await connection.execute(sql, params);
        connection.release();
        return rows;
      } catch (error: any) {
        if (connection) {
          try {
            // Destroy the connection if it's bad
            if (error.code === 'ECONNRESET' || error.code === 'PROTOCOL_CONNECTION_LOST' || error.fatal) {
              connection.destroy();
            } else {
              connection.release();
            }
          } catch (releaseError) {
            // Ignore release errors
          }
        }
        
        lastError = error;
        
        // If it's a connection error and we have retries left, try again
        if (
          attempt < retries &&
          (error.code === 'ECONNRESET' || 
           error.code === 'PROTOCOL_CONNECTION_LOST' ||
           error.code === 'ETIMEDOUT' ||
           error.message === 'Pool is closed.' ||
           error.fatal)
        ) {
          // Wait a bit before retrying (exponential backoff)
          await new Promise(resolve => setTimeout(resolve, Math.min(100 * attempt, 1000)));
          
          // If pool is closed, recreate it (don't close it, just recreate if needed)
          if (error.message === 'Pool is closed.' || !global.__dbPool) {
            if (global.__dbPool) {
              try {
                // Try to end gracefully, but don't wait if it fails
                global.__dbPool.end().catch(() => {});
              } catch (e) {
                // Ignore errors
              }
            }
            // Clear the pool reference so it will be recreated
            global.__dbPool = undefined;
          }
          
          continue;
        }
        
        // If it's not a connection error or we're out of retries, throw
        throw error;
      }
    }
    
    // If we exhausted all retries, throw the last error
    throw lastError || new Error('Database query failed after retries');
  },

  async queryWithConnection(connection: mysql.PoolConnection, sql: string, params: any[] = []) {
    const [rows] = await connection.execute(sql, params)
    return rows
  }
}
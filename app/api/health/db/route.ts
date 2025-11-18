// app/api/health/db/route.ts
// Database health check endpoint
import { NextResponse } from 'next/server'
import { testDbConnection, getDbConfig } from '@/lib/db-test'

export async function GET() {
  try {
    const config = getDbConfig()
    const status = await testDbConnection()
    
    return NextResponse.json({
      ...status,
      config: {
        host: config.host,
        database: config.database,
        port: config.port,
        hasPassword: config.hasPassword,
        // Don't expose the actual password or username for security
      },
      timestamp: new Date().toISOString()
    }, {
      status: status.connected ? 200 : 503
    })
  } catch (error: any) {
    return NextResponse.json({
      connected: false,
      error: error.message || 'Unknown error',
      message: 'Failed to test database connection',
      timestamp: new Date().toISOString()
    }, {
      status: 500
    })
  }
}


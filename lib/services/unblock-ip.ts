// lib/services/unblock-ip.ts
// Utility to unblock IP addresses
import { db } from '../db'

export async function unblockIP(ip: string): Promise<boolean> {
  try {
    await db.query('DELETE FROM maa_login_ips WHERE ip = ?', [ip])
    return true
  } catch (error) {
    console.error('Error unblocking IP:', error)
    return false
  }
}

export async function unblockAllIPs(): Promise<boolean> {
  try {
    await db.query('DELETE FROM maa_login_ips', [])
    return true
  } catch (error) {
    console.error('Error unblocking all IPs:', error)
    return false
  }
}

export async function getBlockedIPs(): Promise<any[]> {
  try {
    const rows: any = await db.query(
      'SELECT * FROM maa_login_ips WHERE tries >= 3 ORDER BY timeDiff DESC',
      []
    )
    return rows || []
  } catch (error) {
    console.error('Error getting blocked IPs:', error)
    return []
  }
}


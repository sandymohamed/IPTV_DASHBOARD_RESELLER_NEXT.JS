// app/api/admin/unblock-ip/route.ts
// API endpoint to unblock IP addresses
import { NextRequest, NextResponse } from 'next/server'
import { unblockIP, unblockAllIPs, getBlockedIPs } from '@/lib/services/unblock-ip'

export async function GET() {
  try {
    const blockedIPs = await getBlockedIPs()
    return NextResponse.json({
      success: true,
      blockedIPs
    })
  } catch (error: any) {
    return NextResponse.json({
      success: false,
      error: error.message
    }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const ip = searchParams.get('ip')
    const unblockAll = searchParams.get('all') === 'true'

    if (unblockAll) {
      const result = await unblockAllIPs()
      return NextResponse.json({
        success: result,
        message: result ? 'All IPs unblocked successfully' : 'Failed to unblock IPs'
      })
    }

    if (!ip) {
      return NextResponse.json({
        success: false,
        error: 'IP address is required'
      }, { status: 400 })
    }

    const result = await unblockIP(ip)
    return NextResponse.json({
      success: result,
      message: result ? `IP ${ip} unblocked successfully` : 'Failed to unblock IP'
    })
  } catch (error: any) {
    return NextResponse.json({
      success: false,
      error: error.message
    }, { status: 500 })
  }
}


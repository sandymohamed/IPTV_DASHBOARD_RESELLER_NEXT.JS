// app/api/auth/my-account/route.ts
import { getServerSession } from '@/lib/auth/auth'
import { getUserAccount } from '@/lib/services/authService'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession()
    
    const adminid = session?.user?.adminid
    
    if (!adminid) {
      return NextResponse.json(
        { success: false, result: "Unauthorized", payload: null },
        { status: 401 }
      )
    }

    const result = await getUserAccount(typeof adminid === 'string' ? parseInt(adminid) : adminid)

    // Update IP from request
    const ipAddress = request.headers.get('x-forwarded-for') || '127.0.0.1'
    result.session.ip = Array.isArray(ipAddress) ? ipAddress[0] : ipAddress

    return NextResponse.json({
      success: true,
      payload: result.user,
      session: result.session,
    })

  } catch (error: any) {
    console.error('My Account API error:', error)
    return NextResponse.json(
      { success: false, result: error.message || 'Internal server error', payload: null },
      { status: 500 }
    )
  }
}
// app/api/auth/login/route.ts
import { NextRequest, NextResponse } from 'next/server'
import jwt from 'jsonwebtoken'
import { getUserAccount, loginUser } from '@/lib/services/authService'
import { JWT_SECRET } from '@/lib/utils/auth'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
    // Get client IP
    const ipAddress = request.headers.get('x-forwarded-for') || 
                     request.headers.get('x-real-ip') || 
                     '127.0.0.1'

    const result = await loginUser({
      ...body,
      ipAddress: Array.isArray(ipAddress) ? ipAddress[0] : ipAddress
    })

    console.log('🔵 [LOGIN ROUTE] Result:', result)
    if (result.success) {
      if (result.resetRequired) {
        return NextResponse.json({
          success: false,
          result: "reset_required",
          reset_mode: true,
          adminid: result.adminid,
          admin_name: result.admin_name,
          payload: null,
        })
      }

      // Create JWT token
      if (!JWT_SECRET) {
        return NextResponse.json(
          { success: false, result: "JWT_SECRET is not configured", payload: null },
          { status: 500 }
        )
      }
      
      // Ensure resellers is a string for backend compatibility
      const userForToken = { ...result.user };
      if (userForToken.resellers !== undefined) {
        if (Array.isArray(userForToken.resellers)) {
          userForToken.resellers = userForToken.resellers.join(',');
        } else if (typeof userForToken.resellers !== 'string') {
          userForToken.resellers = String(userForToken.resellers || '');
        }
      } else {
        userForToken.resellers = '';
      }
      
      const token = jwt.sign(userForToken, JWT_SECRET, { expiresIn: "24h" })
      

      console.log("result.session:", result)
      
      return NextResponse.json({
        success: true,
        result: token,
        session: result.session,
        payload: result.user,
      })
    } else {
      return NextResponse.json(
        { success: false, result: "Authentication failed", payload: null },
        { status: 401 }
      )
    }

  } catch (error: any) {
    console.error('Login API error:', error)
    
    if (error.message.includes('blocked')) {
      return NextResponse.json(
        { success: false, result: error.message, payload: null },
        { status: 429 }
      )
    }

    return NextResponse.json(
      { success: false, result: error.message || 'Internal server error', payload: null },
      { status: 500 }
    )
  }
}
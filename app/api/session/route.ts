import { NextResponse } from 'next/server';

function decodeTokenExpiry(token: string): Date | undefined {
  try {
    const payload = token.split('.')[1];
    if (!payload) return undefined;
    const decoded = JSON.parse(Buffer.from(payload, 'base64').toString('utf-8'));
    if (decoded?.exp) {
      return new Date(decoded.exp * 1000);
    }
    return undefined;
  } catch {
    return undefined;
  }
}

export async function POST(request: Request) {
  try {
    const { token, expiresAt } = await request.json();

    if (!token || typeof token !== 'string') {
      return NextResponse.json({ success: false, message: 'Token is required' }, { status: 400 });
    }

    const expiryDate =
      typeof expiresAt === 'number' || typeof expiresAt === 'string'
        ? new Date(expiresAt)
        : decodeTokenExpiry(token);

    const response = NextResponse.json({ success: true });
    response.cookies.set({
      name: 'token',
      value: token,
      httpOnly: true,
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production',
      path: '/',
      ...(expiryDate ? { expires: expiryDate } : { maxAge: 60 * 60 * 24 * 7 }),
    });
    return response;
  } catch (error) {
    console.error('Failed to set session cookie', error);
    return NextResponse.json({ success: false, message: 'Failed to set session' }, { status: 500 });
  }
}

export async function DELETE() {
  const response = NextResponse.json({ success: true });
  response.cookies.set({
    name: 'token',
    value: '',
    path: '/',
    expires: new Date(0),
  });
  return response;
}


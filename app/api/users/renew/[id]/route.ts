import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from '@/lib/auth/auth';
import { renewUser } from '@/lib/services/userService';
import { revalidatePath } from 'next/cache';

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession();

    if (!session?.user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const result = await renewUser(params.id, body);

    revalidatePath('/dashboard/user/list');

    return NextResponse.json({
      success: true,
      message: result?.message || 'User renewed successfully',
      data: result,
    });
  } catch (error: any) {
    console.error('Error renewing user:', error);
    return NextResponse.json(
      {
        success: false,
        error: error?.message || error?.error || 'Failed to renew user',
      },
      { status: error?.status || 500 }
    );
  }
}


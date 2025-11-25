import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from '@/lib/auth/auth';
import { fetchWithAuth } from '@/lib/server/fetchWithAuth';
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

    const response = await fetchWithAuth<any>(`/users/lock_unlock/${params.id}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
    });

    revalidatePath('/dashboard/user/list');

    return NextResponse.json({
      success: response?.data?.success || response?.success || true,
      message: response?.message || 'User lock status updated successfully',
      data: response,
    });
  } catch (error: any) {
    console.error('Error locking/unlocking user:', error);
    return NextResponse.json(
      {
        success: false,
        error: error?.message || error?.error || 'Failed to update lock status',
      },
      { status: error?.status || 500 }
    );
  }
}


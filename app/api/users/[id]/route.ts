import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from '@/lib/auth/auth';
import { fetchWithAuth } from '@/lib/server/fetchWithAuth';
import { revalidatePath } from 'next/cache';

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession();

    if (!session?.user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const result = await fetchWithAuth<any>(`/users/${params.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });

    revalidatePath('/dashboard/user/list');

    return NextResponse.json({
      success: result?.data?.success || result?.success || true,
      message: result?.message || 'User updated successfully',
      data: result,
    });
  } catch (error: any) {
    console.error('Error updating user:', error);
    return NextResponse.json(
      {
        success: false,
        error: error?.message || error?.error || 'Failed to update user',
      },
      { status: error?.status || 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession();

    if (!session?.user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const result = await fetchWithAuth<any>(`/users/${params.id}`, {
      method: 'DELETE',
    });

    revalidatePath('/dashboard/user/list');

    return NextResponse.json({
      success: result?.data?.success || result?.success || true,
      message: result?.message || 'User deleted successfully',
      data: result,
    });
  } catch (error: any) {
    console.error('Error deleting user:', error);
    return NextResponse.json(
      {
        success: false,
        error: error?.message || error?.error || 'Failed to delete user',
      },
      { status: error?.status || 500 }
    );
  }
}


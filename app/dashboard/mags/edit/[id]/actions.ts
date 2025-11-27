'use server';

import { revalidatePath } from 'next/cache';
import { AuthFetchError, fetchWithAuth } from '@/lib/server/fetchWithAuth';

interface UpdateMagPayload {
  mac?: string;
  forced_country?: string;
  reseller_notes?: string;
  bouquet?: number[];
  new_order?: number[];
  template_id?: number;
}

interface ActionResult {
  success: boolean;
  message?: string;
  error?: string;
}

export async function updateMagAction(id: string, payload: UpdateMagPayload): Promise<ActionResult> {
  try {
    const response = await fetchWithAuth<any>(`/mags/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    revalidatePath('/dashboard/mags/list');
    revalidatePath(`/dashboard/mags/edit/${id}`);

    return {
      success: true,
      message: response?.message || response?.data?.message || 'MAG device updated successfully',
    };
  } catch (error) {
    if (error instanceof AuthFetchError) {
      return {
        success: false,
        error: error.message || 'Unauthorized',
      };
    }

    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to update MAG device',
    };
  }
}


'use server';

import { revalidatePath } from 'next/cache';
import { AuthFetchError, fetchWithAuth } from '@/lib/server/fetchWithAuth';

interface RenewMagPayload {
  pkg: string;
  exp_date?: number;
  user_logs?: string;
  created_by?: number;
  is_trial: number;
  bouquet?: number[];
  new_order?: number[];
  template_id?: number;
  reseller_notes?: string;
}

interface ActionResult {
  success: boolean;
  message?: string;
  error?: string;
}

export async function renewMagAction(id: string, payload: RenewMagPayload): Promise<ActionResult> {
  try {
    const response = await fetchWithAuth<any>(`/mags/renew/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    revalidatePath('/dashboard/mags/list');
    revalidatePath(`/dashboard/mags/renew/${id}`);

    return {
      success: true,
      message: response?.message || response?.data?.message || 'MAG device renewed successfully',
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
      error: error instanceof Error ? error.message : 'Failed to renew MAG device',
    };
  }
}


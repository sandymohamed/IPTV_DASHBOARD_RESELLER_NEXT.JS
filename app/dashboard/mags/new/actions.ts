'use server';

import { revalidatePath } from 'next/cache';
import { AuthFetchError, fetchWithAuth } from '@/lib/server/fetchWithAuth';

interface CreateMagPayload {
  mac: string;
  forced_country: string;
  reseller_notes?: string;
  pkg: string;
  is_trial: number;
  bouquet: number[];
  new_order?: number[];
  template_id?: number;
}

interface ActionResult {
  success: boolean;
  message?: string;
  error?: string;
}

export async function createMagAction(payload: CreateMagPayload): Promise<ActionResult> {
  try {
    const response = await fetchWithAuth<any>('/mags/', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    revalidatePath('/dashboard/mags/list');

    return {
      success: true,
      message: response?.message || response?.data?.message || 'MAG device created successfully',
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
      error: error instanceof Error ? error.message : 'Failed to create MAG device',
    };
  }
}


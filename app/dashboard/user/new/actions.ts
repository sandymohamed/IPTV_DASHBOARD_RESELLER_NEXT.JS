'use server';

import { revalidatePath } from 'next/cache';
import { AuthFetchError, fetchWithAuth } from '@/lib/server/fetchWithAuth';

interface CreateUserPayload {
  username?: string;
  password?: string;
  forced_country: string;
  reseller_notes?: string;
  pkg: string;
  is_trial: number;
  bouquet: number[];
  new_order?: number[];
}

interface ActionResult {
  success: boolean;
  message?: string;
  error?: string;
}

export async function createUserAction(payload: CreateUserPayload): Promise<ActionResult> {
  try {
    const response = await fetchWithAuth<any>('/users/', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    revalidatePath('/dashboard/user/list');

    return {
      success: true,
      message: response?.message || response?.data?.message || 'User created successfully',
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
      error: error instanceof Error ? error.message : 'Failed to create user',
    };
  }
}


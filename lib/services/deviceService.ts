'use client';

import axios from 'axios';
import { getSession } from 'next-auth/react';

export interface CreateDeviceData {
  mac: string;
  playlist_name: string;
  playlist_url: string;
  exp_date: number | string;
}

export interface CreateAndroidDeviceData {
  mac: string;
  name: string;
  m3u: string;
}

export const createDevice = async (data: CreateDeviceData) => {
  try {
    const session = await getSession();
    const apiToken = (session as any)?.apiToken;

    const response = await axios.post(
      'https://api.onetowns.net/securedserver/add_playlist',
      data,
      {
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${apiToken || ''}`,
          Accept: 'application/json',
        },
      }
    );
    return response;
  } catch (error) {
    console.error('Failed to create device:', error);
    throw error;
  }
};

export const createAndroidDevice = async (data: CreateAndroidDeviceData) => {
  try {
    const session = await getSession();
    const apiToken = (session as any)?.apiToken;

    const response = await axios.post(
      'https://codectafted.shameltv.com/securedserver/add_playlist',
      data,
      {
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${apiToken || ''}`,
          Accept: 'application/json',
        },
      }
    );
    return response;
  } catch (error) {
    console.error('Failed to create Android device:', error);
    throw error;
  }
};


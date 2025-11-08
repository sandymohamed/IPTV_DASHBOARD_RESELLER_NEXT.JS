import { alpha } from '@mui/material/styles';

function createShadow(color: string) {
  const transparent = alpha(color, 0.16);
  return {
    z1: `0 1px 2px 0 ${transparent}`,
    z4: `0 4px 8px 0 ${transparent}`,
    z8: `0 8px 16px 0 ${transparent}`,
    z12: `0 12px 24px -4px ${transparent}`,
    z16: `0 16px 32px -4px ${transparent}`,
    z20: `0 20px 40px -4px ${transparent}`,
    z24: `0 24px 48px 0 ${transparent}`,
  };
}

export default function shadows(themeMode: 'light' | 'dark') {
  const color = themeMode === 'light' ? '#919EAB' : '#000000';
  return createShadow(color);
}

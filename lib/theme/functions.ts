export function pxToRem(value: number) {
  return `${value / 16}rem`;
}

export function remToPx(value: string) {
  return Math.round(parseFloat(value) * 16);
}

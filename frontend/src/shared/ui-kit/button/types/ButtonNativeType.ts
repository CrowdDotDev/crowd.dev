export const buttonNativeTypes = [
  'button',
  'submit',
  'reset',
] as const;

export type ButtonNativeType = typeof buttonNativeTypes[number];

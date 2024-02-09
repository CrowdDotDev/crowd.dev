export const badgeSize = [
  'small',
  'medium',
] as const;

export type BadgeSize = typeof badgeSize[number];

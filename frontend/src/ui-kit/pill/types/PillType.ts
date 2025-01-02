export const pillType = ['primary', 'secondary', 'tertiary', 'success', 'warning', 'transparent'] as const;

export type PillType = (typeof pillType)[number]

export const pillType = ['solid', 'bordered'] as const;

export type PillType = (typeof pillType)[number]

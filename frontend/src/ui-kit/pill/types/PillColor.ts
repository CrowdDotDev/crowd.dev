export const pillColor = ['green', 'primary', 'yellow', 'gray', 'transparent'] as const

export type PillColor = (typeof pillColor)[number]

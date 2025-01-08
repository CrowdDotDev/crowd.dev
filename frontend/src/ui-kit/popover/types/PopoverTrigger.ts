export const popoverTrigger = [
  'click',
  'hover',
] as const;

export type PopoverTrigger = typeof popoverTrigger[number];

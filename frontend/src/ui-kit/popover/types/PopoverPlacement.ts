export const popoverPlacements = [
  'bottom-start',
  'bottom',
  'bottom-end',
  'top',
  'top-start',
  'top-end',
  'left',
  'left-start',
  'left-end',
  'right',
  'right-start',
  'right-end',
] as const;

export type PopoverPlacement = typeof popoverPlacements[number];

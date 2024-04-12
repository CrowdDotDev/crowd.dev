export const dropdownPlacements = [
  'bottom-start',
  'bottom',
  'bottom-end',
  'top',
  'top-start',
  'top-end',
] as const;

export type DropdownPlacement = typeof dropdownPlacements[number];

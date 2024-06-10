export const tooltipPlacements = [
  'bottom-start',
  'bottom',
  'bottom-end',
  'top',
  'top-start',
  'top-end',
  'left',
  'right',
] as const;

export type TooltipPlacement = typeof tooltipPlacements[number];

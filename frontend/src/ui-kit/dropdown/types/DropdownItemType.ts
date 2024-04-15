export const dropdownItemTypes = [
  'regular',
  'danger',
] as const;

export type DropdownItemType = typeof dropdownItemTypes[number];

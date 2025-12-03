// Copyright (c) 2025 The Linux Foundation and each contributor.
// SPDX-License-Identifier: MIT
export interface DropdownOption {
  label: string;
  value: string;
  description?: string;
}

export interface DropdownGroupOptions {
  label: string;
  items: DropdownOption[];
}

export const dropdownSizes = ['default', 'small'] as const;
export const dropdownTypes = ['filled', 'transparent'] as const;

export type DropdownSize = (typeof dropdownSizes)[number];
export type DropdownType = (typeof dropdownTypes)[number];

export interface DropdownProps {
  modelValue?: string;
  options: DropdownOption[] | DropdownGroupOptions[];
  dropdownIcon?: string;
  placeholder?: string;
  disabled?: boolean;
  type?: DropdownType;
  size?: DropdownSize;
  showFilter?: boolean;
  showGroupBreaks?: boolean;
  icon?: string;
  fullWidth?: boolean;
  center?: boolean;
  prefix?: string;
  dropdownPosition?: 'left' | 'right';
  iconOnlyMobile?: boolean;
  splitLines?: number[]; // index of the lines to split the dropdown
}

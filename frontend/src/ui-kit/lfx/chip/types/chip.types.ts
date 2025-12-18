// Copyright (c) 2025 The Linux Foundation and each contributor.
// SPDX-License-Identifier: MIT
export const chipSizes = ['small', 'default'] as const;
export const chipTypes = ['bordered', 'default'] as const;
export type ChipSize = (typeof chipSizes)[number];
export type ChipType = (typeof chipTypes)[number];

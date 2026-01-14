// Copyright (c) 2025 The Linux Foundation and each contributor.
// SPDX-License-Identifier: MIT
export const popoverTrigger = ['click', 'hover'] as const;

export type PopoverTrigger = (typeof popoverTrigger)[number];

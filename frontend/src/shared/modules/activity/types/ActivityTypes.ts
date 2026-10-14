// Copyright (c) 2026 The Linux Foundation and each contributor.
// SPDX-License-Identifier: MIT

export interface ActivityTypeDefinition {
  display: {
    default: string;
    short: string;
    channel: string;
    author?: string;
  };
  calculateSentiment?: boolean;
}

export interface ActivityTypes {
  default: Record<string, Record<string, ActivityTypeDefinition>>;
  custom: Record<string, Record<string, ActivityTypeDefinition>>;
}

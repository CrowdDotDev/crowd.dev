// Copyright (c) 2025 The Linux Foundation and each contributor.
// SPDX-License-Identifier: MIT

declare global {
  interface Window {
    // Transcend airgap.js API, loaded in index.html
    transcend?: { showConsentManager?: () => void };
  }
}

export const openCookieSettings = () => {
  window.transcend?.showConsentManager?.();
};

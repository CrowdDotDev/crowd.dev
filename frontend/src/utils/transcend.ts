// Copyright (c) 2025 The Linux Foundation and each contributor.
// SPDX-License-Identifier: MIT

declare global {
  interface Window {
    transcend?: { showConsentManager?: () => void };
  }
}

const AIRGAP_SRC = 'https://transcend-cdn.com/cm/f484e2d0-ad2e-43a9-9d64-d07f6fa20966/airgap.js';

let requested = false;

// TODO(linuxfoundation/lfx-cdp-insights-ops#880): airgap.js quarantines the Auth0 transaction
// cookie (a0.spajs.txs.*), so it must not be present during the PKCE exchange. Load it eagerly
// again once that cookie family is classified as Essential in the Transcend bundle.
export const loadConsentManager = () => {
  if (requested || document.querySelector(`script[src="${AIRGAP_SRC}"]`)) {
    return;
  }

  requested = true;

  const script = document.createElement('script');
  script.src = AIRGAP_SRC;
  script.dataset.cfasync = 'false';
  script.dataset.prompt = 'auto';
  document.head.appendChild(script);
};

export const openCookieSettings = () => {
  window.transcend?.showConsentManager?.();
};

/* eslint-disable */ 

export const renderCal = ({
  calLink,
  elementOrSelector = '#embbeded-script',
  layout = 'month_view',
}) => {
  (function (C, A, L) {
    const p = function (a, ar) {
      a.q.push(ar);
    };
    const d = C.document;
    C.Cal = C.Cal
          || function () {
            const cal = C.Cal;
            const ar = arguments;
            if (!cal.loaded) {
              cal.ns = {};
              cal.q = cal.q || [];
              d.head.appendChild(d.createElement('script')).src = A;
              cal.loaded = true;
            }
            if (ar[0] === L) {
              const api = function () {
                p(api, arguments);
              };
              const namespace = ar[1];
              api.q = api.q || [];
              typeof namespace === 'string'
                ? (cal.ns[namespace] = api) && p(api, ar)
                : p(cal, ar);
              return;
            }
            p(cal, ar);
          };
  }(window, 'https://app.cal.com/embed/embed.js', 'init'));
  Cal('init', { origin: 'https://cal.com' });

  Cal('inline', {
    elementOrSelector,
    calLink,
    layout,
  });

  Cal('ui', {
    styles: { branding: { brandColor: '#E94F2E' } },
    hideEventTypeDetails: false,
    layout: 'month_view',
  });
};

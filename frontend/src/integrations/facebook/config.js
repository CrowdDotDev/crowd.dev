export default {
  image: '/images/integrations/facebook.png',
  hideAsIntegration: true,
  organization: {
    handle: (identity) => (identity.url ? identity.url.split('/').at(-1) : identity.name),
  },
};

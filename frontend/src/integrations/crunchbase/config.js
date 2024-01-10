export default {
  image: '/images/integrations/crunchbase.png',
  name: 'Crunchbase',
  hideAsIntegration: true,
  organization: {
    handle: (identity) => (identity.url ? identity.url.split('/').at(-1) : identity.name),
  },
};

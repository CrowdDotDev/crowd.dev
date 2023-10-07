export default {
  enabled: false,
  name: 'Make',
  backgroundColor: '#FFFFFF',
  borderColor: '#FFFFFF',
  description:
    "We're currently working on this integration.",
  image: '/images/integrations/make.svg',
  organization: {
    handle: (identity) => (identity.url ? identity.url.split('/').at(-1) : identity.name),
  },
};

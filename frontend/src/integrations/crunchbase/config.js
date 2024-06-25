export default {
  image: '/images/integrations/crunchbase.png',
  name: 'Crunchbase',
  hideAsIntegration: true,
  organization: {
    identityHandle: ({ identityHandle }) => identityHandle,
    identityLink: ({ identityHandle }) => `https://www.crunchbase.com/organization/${identityHandle}`,
  },
};

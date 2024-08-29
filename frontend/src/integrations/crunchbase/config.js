export default {
  image: '/images/integrations/crunchbase.png',
  name: 'Crunchbase',
  hideAsIntegration: true,
  orgUrlPrefix: 'crunchbase.com/organization/',
  organization: {
    identityHandle: ({ identityHandle }) => identityHandle,
    identityLink: ({ identityHandle }) => `https://www.crunchbase.com/organization/${identityHandle}`,
  },
};

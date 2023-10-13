import Plans from '@/security/plans';

export const planLimits = {
  enrichment: {
    [Plans.values.essential]: 0,
    [Plans.values.growth]: 1000,
    [Plans.values.scale]: 'unlimited',
    [Plans.values.enterprise]: 'unlimited',
  },
  export: {
    [Plans.values.essential]: 2,
    [Plans.values.growth]: 10,
    [Plans.values.scale]: 20,
    [Plans.values.enterprise]: 'unlimited',
  },
  automation: {
    [Plans.values.essential]: 2,
    [Plans.values.growth]: 10,
    [Plans.values.scale]: 20,
    [Plans.values.enterprise]: 'unlimited',
  },
};

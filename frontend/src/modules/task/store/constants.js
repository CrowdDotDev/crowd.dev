export const SUGGESTED_TASKS_NO_INTEGRATIONS_FILTER = {
  and: [
    {
      type: 'suggested',
    },
    {
      name: {
        not: 'Setup your workpace integrations',
      },
    },
  ],
};

export const SUGGESTED_TASKS_FILTER = {
  type: 'suggested',
};

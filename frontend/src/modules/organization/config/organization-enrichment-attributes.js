export const attributesTypes = {
  string: 'Text',
  number: 'Number',
  email: 'E-mail',
  url: 'URL',
  date: 'Date',
  boolean: 'Boolean',
  multiSelect: 'Multi-select',
};

export default [
  {
    name: 'lastEnrichedAt',
    label: 'Last enrichment',
    type: attributesTypes.date,
    showInForm: false,
    showInAttributes: true,
  },
  {
    name: 'industry',
    label: 'Industry',
    type: attributesTypes.string,
    showInForm: true,
    showInAttributes: true,
  },
  {
    name: 'size',
    label: 'Headcount',
    type: attributesTypes.string,
    showInForm: true,
    showInAttributes: false,
  },
  {
    name: 'type',
    label: 'Type',
    type: attributesTypes.string,
    showInForm: true,
    showInAttributes: true,
  },
  {
    name: 'founded',
    label: 'Founded',
    type: attributesTypes.number,
    showInForm: true,
    showInAttributes: true,
  },
];

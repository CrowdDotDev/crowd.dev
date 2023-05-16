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
  },
  {
    name: 'industry',
    label: 'Industry',
    type: attributesTypes.string,
    showInForm: true,
  },
  {
    name: 'size',
    label: 'Size',
    type: attributesTypes.string,
    showInForm: true,
  },
  {
    name: 'type',
    label: 'Type',
    type: attributesTypes.string,
    showInForm: true,
  },
  {
    name: 'founded',
    label: 'Founded',
    type: attributesTypes.number,
    showInForm: true,
  },
  {
    name: 'profiles',
    label: 'Profiles',
    type: attributesTypes.multiSelect,
    showInForm: true,
    isUrl: true,
  },
];

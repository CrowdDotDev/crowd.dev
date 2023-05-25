export enum FilterStringOperator {
  LIKE = 'like',
  NLIKE = 'nlike',
  EQ = 'is',
  NE = 'ne',
}

export const stringOperatorLabels: Record<FilterStringOperator, string> = {
  [FilterStringOperator.EQ]: 'is',
  [FilterStringOperator.NE]: 'is not',
  [FilterStringOperator.LIKE]: 'contains',
  [FilterStringOperator.NLIKE]: 'does not contain',
};

export const stringFilterOperators: {label: string, value: string}[] = [
  {
    label: stringOperatorLabels[FilterStringOperator.EQ],
    value: FilterStringOperator.EQ,
  },
  {
    label: stringOperatorLabels[FilterStringOperator.NE],
    value: FilterStringOperator.NE,
  },
  {
    label: stringOperatorLabels[FilterStringOperator.LIKE],
    value: FilterStringOperator.LIKE,
  },
  {
    label: stringOperatorLabels[FilterStringOperator.NLIKE],
    value: FilterStringOperator.NLIKE,
  },
];

import pgp from 'pg-promise'

export function prepareBulkInsert(
  table: string,
  columns: string[],
  objects: object[],
  onConflict?: string,
) {
  const preparedObjects = objects.map((_, r) => {
    return `(${columns.map((_, c) => `$(rows.r${r}_c${c})`).join(',')})`
  })

  let onConflictClause = ''
  if (onConflict) {
    onConflictClause = `ON CONFLICT ${onConflict}`
  }

  return pgp.as.format(
    `
      INSERT INTO $(table:name) (${columns.map((_, i) => `$(columns.col${i}:name)`).join(',')})
      VALUES ${preparedObjects.join(',')}
      ${onConflictClause}
    `,
    {
      table,
      columns: columns.reduce((acc, c, i) => {
        acc[`col${i}`] = c
        return acc
      }, {}),
      rows: objects.reduce((acc, row, r) => {
        columns.forEach((c, i) => {
          acc[`r${r}_c${i}`] = row[c]
        })
        return acc
      }, {}),
    },
  )
}

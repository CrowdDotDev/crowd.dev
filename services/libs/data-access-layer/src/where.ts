/* eslint-disable @typescript-eslint/no-unused-vars */

interface WhereOp {
  toStr(): string
}

enum Operator {
  AND,
  OR,
  NOT,
  LIKE,
  EQ,
  GT,
  GTE,
  LTE,
  LT,
  IN,
  NOT_IN,
  IS,
  IS_NULL,
  FIELD,
  VALUE,
}

class Field implements WhereOp {
  constructor(private readonly field: string) {}

  toStr(): string {
    return this.field
  }
}

class Value implements WhereOp {
  constructor(private readonly value: string) {}

  toStr(): string {
    return this.value
  }
}

class And implements WhereOp {
  constructor(private readonly ops: WhereOp[]) {}

  toStr(): string {
    return `(${this.ops.map((op) => op.toStr()).join(' AND ')})`
  }
}

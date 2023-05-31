import { isObject } from './object'

export const single = <T>(array: T[], predicate: (arg: T) => boolean): T => {
  const result = singleOrDefault(array, predicate)

  if (result === undefined) {
    throw new Error('Array contains no matching elements!')
  }

  return result
}

export const singleOrDefault = <T>(array: T[], predicate: (arg: T) => boolean): T | undefined => {
  const filtered = array.filter(predicate)
  if (filtered.length === 1) {
    return filtered[0]
  }

  if (filtered.length > 1) {
    throw new Error('Array contains more than one matching element!')
  }

  return undefined
}

export const groupBy = <T, K>(
  array: T[],
  selector: (obj: T) => K,
): Map<K, T[]> | Map<string, T[]> => {
  const isObjectKey: boolean = array.length > 0 && isObject(selector(array[0]))

  if (isObjectKey) {
    const map = new Map<string, T[]>()

    array.forEach((value) => {
      const key = JSON.stringify(selector(value))
      if (map.has(key)) {
        ;(map.get(key) as T[]).push(value)
      } else {
        map.set(key, [value])
      }
    })

    return map
  }

  const map = new Map<K, T[]>()

  array.forEach((value) => {
    const key = selector(value)
    if (map.has(key)) {
      ;(map.get(key) as T[]).push(value)
    } else {
      map.set(key, [value])
    }
  })

  return map
}

export const partition = <T>(array: T[], partitionSize: number): T[][] => {
  if (array.length <= partitionSize) {
    return [array]
  }

  let index = 0
  const results = []
  while (index < array.length) {
    results.push(array.slice(index, index + partitionSize))
    index += partitionSize
  }

  return results
}

function uniqueFilter(value: unknown, index: number, array: unknown[]): boolean {
  return array.indexOf(value) === index
}

export const distinct = <T>(values: T[]): T[] => {
  return values.filter(uniqueFilter)
}

export const distinctBy = <T>(values: T[], selector: (obj: T) => unknown): T[] => {
  const grouped = groupBy(values, selector) as Map<unknown, T[]>
  const keys = Array.from(grouped.keys())

  const results: T[] = []

  for (const key of keys) {
    results.push((grouped.get(key) as T[])[0])
  }

  return results
}

export const sumBy = <T>(list: T[], selector: (obj: T) => number): number => {
  if (list.length === 0) return 0
  return list.reduce((total, entry) => total + selector(entry), 0)
}

export const maxBy = <T>(list: T[], selector: (obj: T) => number): number => {
  if (list.length === 0) return 0
  return Math.max(...list.map((entry) => selector(entry)))
}

export const averageBy = <T>(list: T[], selector: (obj: T) => number): number => {
  if (list.length === 0) return 0
  return sumBy(list, selector) / list.length
}

export const areArraysEqual = <T>(a: T[], b: T[]): boolean => {
  if (a.length !== b.length) {
    return false
  }

  const sortedArr1 = a.slice().sort()
  const sortedArr2 = b.slice().sort()

  for (let i = 0; i < sortedArr1.length; i++) {
    if (sortedArr1[i] !== sortedArr2[i]) {
      return false
    }
  }

  return true
}

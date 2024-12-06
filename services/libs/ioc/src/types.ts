const symbolMap = new Map<string, number>()

const getUniqueSymbol = (name: string): string => {
  if (symbolMap.has(name)) {
    symbolMap.set(name, symbolMap.get(name) + 1)
  } else {
    symbolMap.set(name, 0)
  }

  return `${name}_${symbolMap.get(name)}`
}

export const IOC_TYPES = {
  SERVICE: getUniqueSymbol('service'),
  LOGGER: getUniqueSymbol('logger'),

  REDIS_CLIENT: getUniqueSymbol('redis_client'),
  REDIS_PUBSUB: getUniqueSymbol('redis_pubsub'),

  TEMPORAL_CLIENT: getUniqueSymbol('temporal_client'),
  TEMPORAL_WORKER: getUniqueSymbol('temporal_worker'),
}

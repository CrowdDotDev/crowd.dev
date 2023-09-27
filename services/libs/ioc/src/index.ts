import 'reflect-metadata'

import { IS_TEST_ENV } from '@crowd/common'
import { Container } from 'inversify'

let instance: Container | undefined

export const IOC = (): Container => {
  if (instance) {
    return instance
  }

  instance = new Container({
    skipBaseClassChecks: true,
    autoBindInjectable: true,
  })

  return instance
}

export const childIocContainer = (): Container => {
  const child = new Container()
  child.parent = IOC()

  return child
}

export const setIocInstance = (ioc: Container): void => {
  if (IS_TEST_ENV) {
    instance = ioc
  } else {
    throw new Error('IOC instance can only be set in test environment')
  }
}

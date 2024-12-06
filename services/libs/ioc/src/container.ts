import { AsyncContainerModule, Container, ContainerModule, interfaces } from 'inversify'

import { IOC_TYPES } from './types'

export const serviceContainer = (service: string): Container => {
  const container = new Container({ skipBaseClassChecks: true })

  container.bind<string>(IOC_TYPES.SERVICE).toConstantValue(service)

  return container
}

export const childContainer = (parent: Container): Container => {
  const child = new Container({ skipBaseClassChecks: true })
  child.parent = parent
  return child
}

export const containerModule = (prepare: interfaces.ContainerModuleCallBack): ContainerModule => {
  const module = new ContainerModule(prepare)
  return module
}

export const asyncContainerModule = (
  prepare: interfaces.AsyncContainerModuleCallBack,
): AsyncContainerModule => {
  const module = new AsyncContainerModule(prepare)
  return module
}

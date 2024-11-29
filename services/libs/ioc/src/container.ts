import { Container, ContainerModule, interfaces } from 'inversify'

export const serviceContainer = (): Container => {
  return new Container({ skipBaseClassChecks: true })
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

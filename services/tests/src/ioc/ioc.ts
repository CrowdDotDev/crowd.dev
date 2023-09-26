import 'reflect-metadata';

import { LOGGING_IOC_MODULE } from '@crowd/logging';
import { DATABASE_IOC_MODULE } from '@crowd/database';

import { Container } from 'inversify';

export const IOC = new Container({
  skipBaseClassChecks: true,
  autoBindInjectable: true,
});

export const childIocContainer = (): Container => {
  const child = new Container();
  child.parent = IOC;

  return child;
};

export const TEST_IOC_MODULE = async (
  maxConcurrentProcessing: number
): Promise<void> => {
  IOC.load(LOGGING_IOC_MODULE());
  IOC.load(
    await DATABASE_IOC_MODULE(
      IOC,
      {
        host: 'localhost',
        port: 5433,
        user: 'postgres',
        password: 'example',
        database: 'crowd-web',
      },
      maxConcurrentProcessing
    )
  );
};

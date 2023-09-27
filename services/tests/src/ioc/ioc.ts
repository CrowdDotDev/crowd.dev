import { LOGGING_IOC_MODULE } from '@crowd/logging';
import { DATABASE_IOC_MODULE } from '@crowd/database';
import { IOC } from '@crowd/ioc';

export const TEST_IOC_MODULE = async (
  maxConcurrentProcessing: number
): Promise<void> => {
  const ioc = IOC();
  ioc.load(LOGGING_IOC_MODULE());
  ioc.load(
    await DATABASE_IOC_MODULE(
      ioc,
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

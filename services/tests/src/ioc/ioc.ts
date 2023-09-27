import { PubSubEmitter, REDIS_IOC_MODULE } from '@crowd/redis';
import { LOGGING_IOC_MODULE } from '@crowd/logging';
import { DATABASE_IOC_MODULE } from '@crowd/database';
import { IOC } from '@crowd/ioc';
import { Emitters, SQS_IOC_MODULE } from '@crowd/sqs';

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

  ioc.load(
    await REDIS_IOC_MODULE(
      ioc,
      {
        username: '',
        password: '',
        host: 'localhost',
        port: '6380',
      },
      PubSubEmitter.API
    )
  );

  ioc.load(
    await SQS_IOC_MODULE(
      ioc,
      {
        region: 'elasticmq',
        host: 'localhost',
        port: 9325,
        accessKeyId: 'x',
        secretAccessKey: 'x',
      },
      Emitters.INTEGRATION_STREAM_WORKER |
        Emitters.INTEGRATION_RUN_WORKER |
        Emitters.SEARCH_SYNC_WORKER |
        Emitters.INTEGRATION_SYNC_WORKER
    )
  );
};

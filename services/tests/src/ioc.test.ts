import {
  DATABASE_IOC,
  DbConnection,
  DbInstance,
  DbStore,
  IDatabaseConfig,
} from '@crowd/database';
import { LOGGING_IOC, Logger } from '@crowd/logging';
import { IOC, TEST_IOC_MODULE } from './ioc/ioc';

describe('ioc', () => {
  beforeAll(async () => {
    await TEST_IOC_MODULE(5);
  });

  it('should initialize logging', () => {
    const log = IOC.get<Logger>(LOGGING_IOC.logger);
    expect(log).toBeDefined();
  });

  it('should initialize database', async () => {
    const config = IOC.get<IDatabaseConfig>(DATABASE_IOC.config);
    expect(config).toBeDefined();

    const connection = IOC.get<DbConnection>(DATABASE_IOC.connection);
    expect(connection).toBeDefined();

    const store = IOC.get<DbStore>(DATABASE_IOC.store);
    expect(store).toBeDefined();

    const instance = IOC.get<DbInstance>(DATABASE_IOC.instance);
    expect(instance).toBeDefined();

    const res = await connection.one('select 1 as result');
    expect(res).toBeDefined();
    expect(res.result).toBe(1);
  });
});

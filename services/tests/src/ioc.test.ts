import {
  DATABASE_IOC,
  DbConnection,
  DbInstance,
  DbStore,
  IDatabaseConfig,
} from '@crowd/database';
import { LOGGING_IOC, Logger, getChildLogger } from '@crowd/logging';
import { TEST_IOC_MODULE } from './ioc/ioc';
import { IOC, childIocContainer, setIocInstance } from '@crowd/ioc';

describe('ioc', () => {
  beforeAll(async () => {
    await TEST_IOC_MODULE(5);
  });

  it('should initialize logging', () => {
    const ioc = IOC();

    const log = ioc.get<Logger>(LOGGING_IOC.logger);
    expect(log).toBeDefined();
  });

  it('should initialize database', async () => {
    const ioc = IOC();

    const config = ioc.get<IDatabaseConfig>(DATABASE_IOC.config);
    expect(config).toBeDefined();

    const connection = ioc.get<DbConnection>(DATABASE_IOC.connection);
    expect(connection).toBeDefined();

    const store = ioc.get<DbStore>(DATABASE_IOC.store);
    expect(store).toBeDefined();

    const instance = ioc.get<DbInstance>(DATABASE_IOC.instance);
    expect(instance).toBeDefined();

    const res = await connection.one('select 1 as result');
    expect(res).toBeDefined();
    expect(res.result).toBe(1);
  });

  it('should be overridable in tests', async () => {
    let ioc = IOC();
    const originalLogger = ioc.get<Logger>(LOGGING_IOC.logger);
    expect(originalLogger.fields.testProperty).not.toBeDefined();

    const testIoc = childIocContainer();

    const newLogger = getChildLogger('test', originalLogger, {
      testProperty: 'blabla',
    });

    testIoc.bind(LOGGING_IOC.logger).toConstantValue(newLogger);

    setIocInstance(testIoc);

    ioc = IOC();

    const testLogger = ioc.get<Logger>(LOGGING_IOC.logger);
    expect(testLogger.fields.testProperty).toBeDefined();
  });
});

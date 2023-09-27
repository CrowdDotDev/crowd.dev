import { TEST_IOC_MODULE } from '@/ioc/ioc';
import { IOC } from '@crowd/ioc';
import IntegrationRunService from '@crowdapp/integration_run_worker/src/service/integrationRunService';
import { APP_IOC as INT_RUN_WORKER_APP_IOC } from '@crowdapp/integration_run_worker/src/ioc_constants';
import { ContainerModule } from 'inversify';

describe('integration runs', () => {
  beforeAll(async () => {
    await TEST_IOC_MODULE(5);

    IOC().load(
      new ContainerModule((bind) => {
        bind(INT_RUN_WORKER_APP_IOC.runService)
          .to(IntegrationRunService)
          .inRequestScope();
      })
    );
  });

  it('should start an integration run', async () => {
    const ioc = IOC();
    const service = ioc.get<IntegrationRunService>(
      INT_RUN_WORKER_APP_IOC.runService
    );

    // todo prepare tenant, integrations tables entries

    // todo start integration run
  });
});

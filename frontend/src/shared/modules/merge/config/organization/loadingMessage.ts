import Message from '@/shared/message/message';
import { useOrganizationStore } from '@/modules/organization/store/pinia';
import { storeToRefs } from 'pinia';

export default () => {
  const organizationStore = useOrganizationStore();
  const {
    mergedOrganizations,
  } = storeToRefs(organizationStore);

  const processesRunning = Object.keys(mergedOrganizations.value).length;

  Message.closeAll();
  Message.info(null, {
    title: 'Organizations merging in progress',
    message: processesRunning > 1 ? `${processesRunning} processes running` : null,
  });
};

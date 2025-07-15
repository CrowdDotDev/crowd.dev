import { ToastStore } from '@/shared/message/notification';
import { SocketErrorMessage } from '../../types/OrganizationMessage';

export default ({ primaryOrganization, secondaryOrganization }: SocketErrorMessage) => {
  const { displayName: primaryDisplayName } = primaryOrganization;
  const { displayName: secondaryDisplayName } = secondaryOrganization;

  ToastStore.closeAll();
  ToastStore.error(`There was an error merging ${secondaryDisplayName} with ${primaryDisplayName}`);
};

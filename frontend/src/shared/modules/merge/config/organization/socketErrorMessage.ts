import { MessageStore } from '@/shared/message/notification';
import { SocketErrorMessage } from '../../types/OrganizationMessage';

export default ({ primaryOrganization, secondaryOrganization }: SocketErrorMessage) => {
  const { displayName: primaryDisplayName } = primaryOrganization;
  const { displayName: secondaryDisplayName } = secondaryOrganization;

  MessageStore.closeAll();
  MessageStore.error(`There was an error merging ${secondaryDisplayName} with ${primaryDisplayName}`);
};

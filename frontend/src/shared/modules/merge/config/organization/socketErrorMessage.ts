import Message from '@/shared/message/message';
import { SocketErrorMessage } from '../../types/OrganizationMessage';

export default ({ primaryOrganization, secondaryOrganization }: SocketErrorMessage) => {
  const { displayName: primaryDisplayName } = primaryOrganization;
  const { displayName: secondaryDisplayName } = secondaryOrganization;

  Message.closeAll();
  Message.error(`There was an error merging ${secondaryDisplayName} with ${primaryDisplayName}`);
};

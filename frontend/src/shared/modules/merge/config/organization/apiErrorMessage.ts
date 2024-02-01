import Message from '@/shared/message/message';
import { ApiErrorMessage } from '../../types/OrganizationMessage';

export default ({ error }: ApiErrorMessage) => {
  Message.closeAll();

  if (error.response.status === 404) {
    Message.success('Organizations already merged or deleted', {
      message: `Sorry, the organizations you are trying to merge might have already been merged or deleted.
        Please refresh to see the updated information.`,
    });

    return true;
  }

  Message.error('There was an error merging organizations');
  return false;
};

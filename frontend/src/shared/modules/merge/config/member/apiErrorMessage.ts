import Message from '@/shared/message/message';
import { ErrorMessage } from '../../types/MemberMessage';

export default ({ error }: ErrorMessage) => {
  Message.closeAll();
  if (error.response.status === 404) {
    Message.error('Contributors already merged or deleted', {
      message: `Sorry, the contributors you are trying to merge might have already been merged or deleted.
          Please refresh to see the updated information.`,
    });
  } else {
    Message.error('There was an error merging contributors');
  }
};

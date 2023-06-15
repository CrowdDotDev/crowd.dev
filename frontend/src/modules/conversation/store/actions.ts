import { ConversationState } from '@/modules/conversation/store/state';
import { ConversationService } from '@/modules/conversation/conversation-service';

export default {
  fetchConversation(this: ConversationState, body: any, reload = false): Promise<any> {
    const mappedBody = reload ? this.savedFilterBody : body;
    this.conversations = [];
    return ConversationService.listConversations(mappedBody)
      .then((data: any) => {
        this.conversations = data.rows;
        this.totalConversations = data.count;
        this.savedFilterBody = mappedBody;
        return Promise.resolve(data);
      })
      .catch((err: Error) => {
        this.conversations = [];
        this.totalConversations = 0;
        return Promise.reject(err);
      });
  },
};

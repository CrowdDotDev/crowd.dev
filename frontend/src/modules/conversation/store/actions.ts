import { ConversationState } from '@/modules/conversation/store/state';
import { ConversationService } from '@/modules/conversation/conversation-service';

export default {
  fetchConversation(this: ConversationState, body: any, reload = false, append = false): Promise<any> {
    const mappedBody = reload ? this.savedFilterBody : body;

    if (!append) {
      this.conversations = [];
      this.pagination = {
        page: 1,
        perPage: 20,
      };
    }
    return ConversationService.query(mappedBody)
      .then((data: any) => {
        // If append is true, join new activities with the existent ones
        if (append) {
          this.conversations = this.conversations.concat(...data.rows);
        } else {
          this.conversations = data.rows;
        }
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

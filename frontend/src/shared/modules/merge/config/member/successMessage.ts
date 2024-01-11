import { h } from 'vue';
import Message from '@/shared/message/message';
import { router } from '@/router';
import { SuccessMessage } from '../../types/MemberMessage';

export default ({ primaryMember, secondaryMember, selectedProjectGroupId }: SuccessMessage) => {
  const { id, displayName: primaryDisplayName } = primaryMember;
  const { displayName: secondaryDisplayName } = secondaryMember;

  Message.closeAll();
  Message.success(
    h(
      'div',
      {
        class: 'flex flex-col gap-2',
      },
      [
        h(
          'span',
          {
            innerHTML: `${secondaryDisplayName} merged with ${primaryDisplayName}.`,
          },
        ),
        h(
          'el-button',
          {
            class: 'btn btn--xs btn--secondary !h-6 !w-fit',
            onClick: () => {
              router.push({
                name: 'memberView',
                params: { id },
                query: { projectGroup: selectedProjectGroupId },
              });
              Message.closeAll();
            },
          },
          'View contributor',
        ),
      ],
    ),
    {
      title:
        'Contributors merged successfully',
    },
  );
};

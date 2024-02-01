import { h } from 'vue';
import Message from '@/shared/message/message';
import { router } from '@/router';
import { SuccessMessage } from '../../types/OrganizationMessage';

export default ({ primaryOrganization, secondaryOrganization }: SuccessMessage) => {
  const { id, displayName: primaryDisplayName } = primaryOrganization;
  const { displayName: secondaryDisplayName } = secondaryOrganization;

  const buttonElement = h(
    'el-button',
    {
      class: 'btn btn--xs btn--secondary !h-6 !w-fit',
      onClick: () => {
        router.push({
          name: 'organizationView',
          params: { id },
        });
        Message.closeAll();
      },
    },
    'View organization',
  );

  const messageElements = [buttonElement];

  if (primaryDisplayName && secondaryDisplayName) {
    const descriptionElement = h(
      'span',
      {
        innerHTML: `${secondaryDisplayName} merged with ${primaryDisplayName}.`,
      },
    );

    messageElements.unshift(descriptionElement);
  }

  Message.closeAll();
  Message.success(
    h(
      'div',
      {
        class: 'flex flex-col gap-2',
      },
      messageElements,
    ),
    {
      title: 'Organizations merged successfully',
    },
  );
};

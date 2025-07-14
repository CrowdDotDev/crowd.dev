import { h } from 'vue';
import { MessageStore } from '@/shared/message/notification';
import { router } from '@/router';
import { SuccessMessage } from '../../types/OrganizationMessage';

export default ({ primaryOrganization, secondaryOrganization }: SuccessMessage) => {
  const { id, displayName: primaryDisplayName } = primaryOrganization;
  const { displayName: secondaryDisplayName } = secondaryOrganization;

  const buttonElement = h(
    'button',
    {
      class: 'c-btn c-btn--tiny c-btn--secondary-gray !h-6 !w-fit',
      onClick: () => {
        router.push({
          name: 'organizationView',
          params: { id },
        });
        MessageStore.closeAll();
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

  MessageStore.closeAll();
  MessageStore.success(
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

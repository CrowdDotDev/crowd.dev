import io from 'socket.io-client';
import { storeToRefs } from 'pinia';
import { h } from 'vue';
import config from '@/config';
import Message from '@/shared/message/message';
import { useOrganizationStore } from '@/modules/organization/store/pinia';
import useOrganizationMergeMessage from '@/shared/modules/merge/config/useOrganizationMergeMessage';
import { useAuthStore } from '@/modules/auth/store/auth.store';
import { useLfSegmentsStore } from '@/modules/lf/segments/store';

let socketIoClient: any;

const SocketEvents = {
  connect: 'connect',
  disconnect: 'disconnect',
  integrationCompleted: 'integration-completed',
  orgMerge: 'org-merge',
  memberMerge: 'member-merge',
  memberUnmerge: 'member-unmerge',
  organizationUnmerge: 'organization-unmerge',
};

export const isSocketConnected = () => socketIoClient && socketIoClient.connected;

export const connectSocket = (token) => {
  const authStore = useAuthStore();
  const { user } = storeToRefs(authStore);
  if (socketIoClient && socketIoClient.connected) {
    socketIoClient.disconnect();
  }

  const path = config.env === 'production' || config.env === 'staging'
    ? '/api/socket.io'
    : '/socket.io';

  socketIoClient = io(`${config.websocketsUrl}/user`, {
    path,
    query: {
      token,
    },
    transports: ['websocket'],
    forceNew: true,
  });

  socketIoClient.on(SocketEvents.connect, () => {
    console.info('Socket connected');
  });

  socketIoClient.on(SocketEvents.disconnect, () => {
    console.info('Socket disconnected');
  });

  socketIoClient.on(SocketEvents.integrationCompleted, (data) => {
    console.info('Integration onboarding done', data);
    // store.dispatch(
    //   'integration/doFind',
    //   JSON.parse(data).integrationId,
    // );
  });

  socketIoClient.on(SocketEvents.memberMerge, (data) => {
    console.info('Member merge done', data);
    const parsedData = JSON.parse(data);
    if (!parsedData.success) {
      return;
    }
    const lsSegmentsStore = useLfSegmentsStore();
    const { selectedProjectGroup } = storeToRefs(lsSegmentsStore);
    const {
      primaryDisplayName,
      secondaryDisplayName,
      primaryId,
      secondaryId,
      userId,
    } = parsedData;

    if (user.value?.id !== userId) {
      return;
    }

    const primaryMember = h(
      'a',
      {
        href: `${window.location.origin}/people/${primaryId}?projectGroup=${selectedProjectGroup.value?.id}`,
        class: 'underline text-gray-600',
      },
      primaryDisplayName,
    );
    const secondaryMember = h(
      'a',
      {
        href: `${window.location.origin}/people/${secondaryId}?projectGroup=${selectedProjectGroup.value?.id}`,
        class: 'underline text-gray-600',
      },
      secondaryDisplayName,
    );
    const between = h(
      'span',
      {},
      ' merged into ',
    );
    const after = h(
      'span',
      {},
      '. Finalizing profile merging might take some time to complete.',
    );
    Message.closeAll();
    Message.success(h(
      'div',
      {},
      [secondaryMember, between, primaryMember, after],
    ), {
      title: 'Profiles merged successfully',
    });
  });

  socketIoClient.on(SocketEvents.memberUnmerge, (data) => {
    console.info('Member unmerge done', data);
    const parsedData = JSON.parse(data);
    if (!parsedData.success) {
      return;
    }
    const lsSegmentsStore = useLfSegmentsStore();
    const { selectedProjectGroup } = storeToRefs(lsSegmentsStore);
    const {
      primaryDisplayName,
      secondaryDisplayName,
      primaryId,
      secondaryId,
      userId,
    } = parsedData;

    if (user.value?.id !== userId) {
      return;
    }

    const primaryMember = h(
      'a',
      {
        href: `${window.location.origin}/people/${primaryId}?projectGroup=${selectedProjectGroup.value?.id}`,
        class: 'underline text-gray-600',
      },
      primaryDisplayName,
    );
    const secondaryMember = h(
      'a',
      {
        href: `${window.location.origin}/people/${secondaryId}?projectGroup=${selectedProjectGroup.value?.id}`,
        class: 'underline text-gray-600',
      },
      secondaryDisplayName,
    );
    const between = h(
      'span',
      {},
      ' unmerged from ',
    );
    const after = h(
      'span',
      {},
      '. Finalizing profile unmerging might take some time to complete.',
    );
    Message.closeAll();
    Message.success(h(
      'div',
      {},
      [secondaryMember, between, primaryMember, after],
    ), {
      title: 'Profiles unmerged successfully',
    });
  });

  socketIoClient.on(SocketEvents.organizationUnmerge, (data) => {
    console.info('Organization unmerge done', data);
    const parsedData = JSON.parse(data);
    if (!parsedData.success) {
      return;
    }
    const lsSegmentsStore = useLfSegmentsStore();
    const { selectedProjectGroup } = storeToRefs(lsSegmentsStore);
    const {
      primaryDisplayName, secondaryDisplayName, primaryId, secondaryId, userId,
    } = parsedData;

    if (user.value?.id !== userId) {
      return;
    }

    const primaryOrganization = h(
      'a',
      {
        href: `${window.location.origin}/organizations/${primaryId}?projectGroup=${selectedProjectGroup.value?.id}`,
        class: 'underline text-gray-600',
      },
      primaryDisplayName,
    );
    const secondaryOrganization = h(
      'a',
      {
        href: `${window.location.origin}/organizations/${secondaryId}?projectGroup=${selectedProjectGroup.value?.id}`,
        class: 'underline text-gray-600',
      },
      secondaryDisplayName,
    );
    const between = h(
      'span',
      {},
      ' unmerged from ',
    );
    const after = h(
      'span',
      {},
      '. Syncing organization activities might take some time to complete.',
    );
    Message.closeAll();
    Message.success(h(
      'div',
      {},
      [secondaryOrganization, between, primaryOrganization, after],
    ), {
      title: 'Organizations unmerged successfully',
    });
  });

  socketIoClient.on(SocketEvents.orgMerge, (payload) => {
    const {
      success,
      userId,
      primaryOrgId,
      original,
      toMerge,
    } = JSON.parse(payload);

    if (user.value.id !== userId) {
      return;
    }

    const { removeMergedOrganizations } = useOrganizationStore();
    const primaryOrganization = {
      id: primaryOrgId,
      displayName: original,
    };
    const secondaryOrganization = {
      displayName: toMerge,
    };

    Message.closeAll();

    removeMergedOrganizations(primaryOrgId);

    const { successMessage, socketErrorMessage } = useOrganizationMergeMessage;
    if (success) {
      successMessage({
        primaryOrganization,
        secondaryOrganization,
      });
    } else {
      socketErrorMessage({
        primaryOrganization,
        secondaryOrganization,
      });
    }
  });
};

export const disconnectSocket = () => {
  if (socketIoClient) {
    socketIoClient.disconnect();
  }
};

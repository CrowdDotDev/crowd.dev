import io from 'socket.io-client';
import pluralize from 'pluralize';
import config from '@/config';
import Message from '@/shared/message/message';
import {
  showEnrichmentSuccessMessage,
  getEnrichmentMax,
} from '@/modules/member/member-enrichment';
import { useMemberStore } from '@/modules/member/store/pinia';
import { useOrganizationStore } from '@/modules/organization/store/pinia';
import useOrganizationMergeMessage from '@/shared/modules/merge/config/useOrganizationMergeMessage';
import { useAuthStore } from '@/modules/auth/store/auth.store';
import { useLfSegmentsStore } from '@/modules/lf/segments/store';
import { storeToRefs } from 'pinia';
import { h } from 'vue';

let socketIoClient: any;

const SocketEvents = {
  connect: 'connect',
  disconnect: 'disconnect',
  integrationCompleted: 'integration-completed',
  tenantPlanUpgraded: 'tenant-plan-upgraded',
  bulkEnrichment: 'bulk-enrichment',
  orgMerge: 'org-merge',
  memberMerge: 'member-merge',
  memberUnmerge: 'member-unmerge',
  organizationUnmerge: 'organization-unmerge',
};

export const isSocketConnected = () => socketIoClient && socketIoClient.connected;

export const connectSocket = (token) => {
  const authStore = useAuthStore();
  const { user, tenant } = storeToRefs(authStore);
  const { getUser } = authStore;
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
      tenantId,
      userId,
    } = parsedData;

    if (tenant.value?.id !== tenantId || user.value?.id !== userId) {
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
      tenantId,
      userId,
    } = parsedData;

    if (tenant.value?.id !== tenantId || user.value?.id !== userId) {
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
      primaryDisplayName, secondaryDisplayName, primaryId, secondaryId, tenantId, userId,
    } = parsedData;

    if (tenant.value?.id !== tenantId || user.value?.id !== userId) {
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

  socketIoClient.on(
    SocketEvents.tenantPlanUpgraded,
    async (data) => {
      console.info(
        'Tenant plan is upgraded. Force a hard refresh!',
        data,
      );
      let parsed = data;
      if (typeof data === 'string') {
        parsed = JSON.parse(data);
      }

      await getUser();

      Message.success(
        `Successfully upgraded to ${parsed.plan} plan`,
      );
    },
  );

  socketIoClient.on(SocketEvents.bulkEnrichment, async (data) => {
    let parsed = data;
    if (typeof data === 'string') {
      parsed = JSON.parse(parsed);
    }

    await getUser();

    const updatedTenant = user.value.tenants.find(
      (tenant) => tenant.tenantId === parsed.tenantId,
    );

    if (!parsed.success) {
      Message.closeAll();
      Message.error(
        `Failed to enrich ${pluralize(
          'person',
          parsed.failedEnrichedMembers,
          true,
        )}.`,
      );
    } else {
      const planEnrichmentCountMax = getEnrichmentMax(
        updatedTenant.tenant.plan,
      );

      // Show enrichment success message
      showEnrichmentSuccessMessage({
        enrichedMembers: parsed.enrichedMembers,
        memberEnrichmentCount:
          updatedTenant.tenant.memberEnrichmentCount,
        planEnrichmentCountMax,
        plan: updatedTenant.tenant.plan,
        isBulk: true,
      });

      // Update members list if tenant hasn't changed
      if (tenant.value.id === parsed.tenantId) {
        // Refresh list page
        const { fetchMembers } = useMemberStore();
        await fetchMembers({ reload: true });
      }
    }
  });

  socketIoClient.on(SocketEvents.orgMerge, (payload) => {
    const {
      success,
      tenantId,
      userId,
      primaryOrgId,
      original,
      toMerge,
    } = JSON.parse(payload);

    if (tenant.value.id !== tenantId || user.value.id !== userId) {
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

import io from 'socket.io-client';
import pluralize from 'pluralize';
import config from '@/config';
import { store } from '@/store';
import Message from '@/shared/message/message';
import {
  showEnrichmentSuccessMessage,
  getEnrichmentMax,
} from '@/modules/member/member-enrichment';
import { useMemberStore } from '@/modules/member/store/pinia';
import { useOrganizationStore } from '@/modules/organization/store/pinia';
import useOrganizationMergeMessage from '@/shared/modules/merge/config/useOrganizationMergeMessage';
import { useAuthStore } from '@/modules/auth/store/auth.store';
import { storeToRefs } from 'pinia';

let socketIoClient;

const SocketEvents = {
  connect: 'connect',
  disconnect: 'disconnect',
  integrationCompleted: 'integration-completed',
  tenantPlanUpgraded: 'tenant-plan-upgraded',
  bulkEnrichment: 'bulk-enrichment',
  orgMerge: 'org-merge',
};

export const connectSocket = (token) => {
  const authStore = useAuthStore();
  const { user, tenant } = storeToRefs(authStore);
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
    store.dispatch(
      'integration/doFind',
      JSON.parse(data).integrationId,
    );
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

      await store.dispatch('auth/doRefreshCurrentUser');

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

    await store.dispatch('auth/doRefreshCurrentUser');

    const updatedTenant = user.value.tenants.find(
      (tenant) => tenant.tenantId === parsed.tenantId,
    );

    if (!parsed.success) {
      Message.closeAll();
      Message.error(
        `Failed to enrich ${pluralize(
          'contributor',
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

    if (tenant.value.id !== tenantId && user.value.id !== userId) {
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

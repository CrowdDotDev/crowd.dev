import io from 'socket.io-client';
import { computed } from 'vue';
import pluralize from 'pluralize';
import config from '@/config';
import { store } from '@/store';
import Message from '@/shared/message/message';
import {
  showEnrichmentSuccessMessage,
  getEnrichmentMax,
} from '@/modules/member/member-enrichment';
import { useMemberStore } from '@/modules/member/store/pinia';

let socketIoClient;

export const connectSocket = (token) => {
  if (socketIoClient && socketIoClient.connected) {
    socketIoClient.disconnect();
  }
  const currentTenant = computed(
    () => store.getters['auth/currentTenant'],
  );
  const currentUser = computed(
    () => store.getters['auth/currentUser'],
  );

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

  socketIoClient.on('connect', () => {
    console.info('Socket connected');
  });

  socketIoClient.on('disconnect', () => {
    console.info('Socket disconnected');
  });

  socketIoClient.on('integration-completed', (data) => {
    console.info('Integration onboarding done', data);
    store.dispatch(
      'integration/doFind',
      JSON.parse(data).integrationId,
    );
  });

  socketIoClient.on(
    'tenant-plan-upgraded',
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

  socketIoClient.on('bulk-enrichment', async (data) => {
    let parsed = data;
    if (typeof data === 'string') {
      parsed = JSON.parse(parsed);
    }

    await store.dispatch('auth/doRefreshCurrentUser');

    const updatedTenant = currentUser.value.tenants.find(
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
      if (currentTenant.value.id === parsed.tenantId) {
        // Refresh list page
        const { fetchMembers } = useMemberStore();
        await fetchMembers({ reload: true });
      }
    }
  });
};

export const disconnectSocket = () => {
  if (socketIoClient) {
    socketIoClient.disconnect();
  }
};

import { createVNode, h } from 'vue';
import AppIntegrationProgress from '@/modules/integration/components/integration-progress.vue';
import AppIntegrationProgressWrapper from '@/modules/integration/components/integration-progress-wrapper.vue';
import { ElNotification } from 'element-plus';
import { CrowdIntegrations } from '@/integrations/integrations-config';

export const showIntegrationProgressNotification = (platform, segmentId) => {
  const label = CrowdIntegrations.getConfig(platform)?.name;
  const defaultSlot = ({ progress }) => {
    const integrationProgress = (progress || []).find((p) => p.platform === platform);
    const text = h('p', {
      class: 'text-2xs text-black leading-4.5 pb-4',
    }, 'Sit back and relax. We will send you an email when the entire process is completed.');
    const fallback = h('p', {
      class: 'text-2xs text-gray-500 leading-4',
    }, integrationProgress ? 'Calculating...' : 'Loading progress...');
    if (!integrationProgress || integrationProgress.reportStatus === 'calculating') {
      return [text, fallback];
    }
    const progressComponentVNode = createVNode(AppIntegrationProgress, {
      progress: integrationProgress,
      showBar: true,
      showParts: true,
    }, {
      default: () => [text],
    });

    return [progressComponentVNode];
  };

  const wrapper = createVNode(AppIntegrationProgressWrapper, {
    segments: [segmentId],
  }, {
    default: defaultSlot,
  });

  ElNotification({
    title: `Connecting ${label} integration`,
    message: wrapper,
    showClose: true,
    customClass: 'info',
    duration: 60000,
    position: 'bottom-right',
    offset: 24,
  });
};

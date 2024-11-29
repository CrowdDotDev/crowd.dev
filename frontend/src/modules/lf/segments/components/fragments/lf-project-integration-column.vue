<template>
  <div
    v-if="props.integrations?.length"
    class="flex gap-1 items-center py-2 overflow-x-auto"
    style="max-width: 100%; scrollbar-width: thin"
  >
    <div v-for="integration in props.integrations" :key="integration.id">
      <el-popover
        :disabled="
          integration.status !== 'in-progress'
            && integration.type !== 'mapped'
            && !getProgress(props.segmentId, integration.platform)
            && !props.progressError
        "
        :width="290"
        placement="top"
      >
        <template #reference>
          <div
            class="relative w-6 h-6 flex-shrink-0 flex items-center justify-center"
          >
            <app-platform-svg
              :platform="integration.platform"
              :color="integration.platform === 'github' && integration?.type === 'mapped' ? 'gray' : 'black'"
            />

            <lf-icon
              v-if="integration.status === 'no-data'"
              name="triangle-exclamation"
              type="solid"
              :size="12"
              class="absolute right-0 top-0 leading-3 text-yellow-500"
            />

            <lf-icon
              v-else-if="integration.status === 'error'"
              name="circle-exclamation"
              type="solid"
              :size="12"
              class="absolute right-0 top-0 leading-3 text-red-600"
            />
            <div
              v-else-if="integration.status === 'in-progress'"
              class="w-4 h-4 bg-white rounded-full -ml-2 flex items-center justify-center -mt-5"
            >
              <lf-spinner size="0.75rem" class="!border-black" />
            </div>
          </div>
        </template>
        <div class="px-1">
          <template v-if="integration.type === 'mapped'">
            <p class="text-xs text-black leading-5">
              Syncing
              {{
                CrowdIntegrations.getConfig(integration.platform)?.name
              }}
              data since this sub-project is mapped with
              <b>{{ (integration as any).mappedWith }}</b> sub-project
            </p>
          </template>
          <template v-else>
            <app-integration-progress
              v-if="!progressError"
              :progress="getProgress(props.segmentId, integration.platform)"
              :show-bar="true"
              :show-parts="true"
            >
              <h6 class="text-xs text-black leading-5 pb-3">
                Connecting
                {{
                  CrowdIntegrations.getConfig(integration.platform)?.name
                }}
                integration
              </h6>
            </app-integration-progress>
            <div v-if="progressError" class="text-xs text-gray-500 flex items-center">
              <lf-icon name="triangle-exclamation" type="light" :size="13" class="text-yellow-600" />
              Error loading progress
            </div>
          </template>
        </div>
      </el-popover>
    </div>
  </div>
  <span v-else class="text-gray-400 text-sm">No integrations</span>
</template>

<script lang="ts" setup>
import { IntegrationProgress } from '@/modules/integration/types/IntegrationProgress';
import { SubProject } from '@/modules/lf/segments/types/Segments';
import { CrowdIntegrations } from '@/integrations/integrations-config';
import LfIcon from '@/ui-kit/icon/Icon.vue';
import AppPlatformSvg from '@/shared/modules/platform/components/platform-svg.vue';
import LfSpinner from '@/ui-kit/spinner/Spinner.vue';
import AppIntegrationProgress from '@/modules/integration/components/integration-progress.vue';

type Integrations = SubProject & IntegrationProgress;

const props = withDefaults(defineProps<{
  segmentId: string,
  integrations: Integrations[],
  progress: any[],
  progressError: boolean,
}>(), {
  progress: () => [],
  progressError: false,
});

const getProgress = (segmentId: string, platform: string) => (props.progress || []).find(
  (p: any) => p.segmentId === segmentId && p.platform === platform,
) || null;

</script>

<script lang="ts">
export default {
  name: 'LfProjectIntegrationColumn',
};
</script>

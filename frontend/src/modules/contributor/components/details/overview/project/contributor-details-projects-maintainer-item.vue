<template>
  <el-popover placement="top" width="20rem">
    <template #reference>
      <lf-badge
        type="secondary"
        class="!flex items-center gap-1"
      >
        <slot />
      </lf-badge>
    </template>
    <div class="p-1 flex flex-col gap-6 max-h-80 overflow-auto">
      <section v-if="currentRepos.length > 0">
        <p class="text-small font-semibold text-gray-400 pb-4">
          Repositories
        </p>
        <div class="flex flex-col gap-6">
          <section v-for="segmentId of segmentIds" :key="segmentId" class="flex flex-col gap-4">
            <p v-if="props.showProjects" class="text-small text-gray-400 font-semibold">
              {{ getSegmentName(segmentId) }}
            </p>
            <article
              v-for="repo of currentRepos.filter((r) => r.segmentId === segmentId)"
              :key="repo.id"
              class="flex items-center justify-between"
            >
              <div class="flex items-center gap-2">
                <img :src="getPlatform(repo.repoType)?.image" :alt="repo.repoType" class="w-4 h-4" />
                <a
                  :href="repo.url"
                  target="_blank"
                  rel="noopener noreferrer"
                  class="cursor-pointer text-small leading-5 underline decoration-dashed text-black
             decoration-gray-500 underline-offset-4 hover:decoration-gray-900 hover:!text-black inline truncate"
                  style="max-width: 18ch"
                >
                  {{ getRepoName(repo.url) }}
                </a>
              </div>
              <p class="text-small text-gray-400">
                since {{ moment(repo.dateStart).format('MMM YYYY') }}
              </p>
            </article>
          </section>
        </div>
      </section>
      <section v-if="previousRepos.length > 0">
        <p class="text-small font-semibold text-gray-400 pb-4">
          Previously
        </p>
        <div class="flex flex-col gap-6">
          <section v-for="segmentId of segmentIds" :key="segmentId" class="flex flex-col gap-4">
            <p v-if="props.showProjects" class="text-small text-gray-400 font-semibold">
              {{ getSegmentName(segmentId) }}
            </p>
            <article
              v-for="repo of previousRepos.filter((r) => r.segmentId === segmentId)"
              :key="repo.id"
              class="flex items-center justify-between"
            >
              <div class="flex items-center gap-2">
                <img :src="getPlatform(repo.repoType)?.image" :alt="repo.repoType" class="w-4 h-4" />
                <a
                  :href="repo.url"
                  target="_blank"
                  rel="noopener noreferrer"
                  class="cursor-pointer text-small leading-5 underline decoration-dashed text-black
             decoration-gray-500 underline-offset-4 hover:decoration-gray-900 hover:!text-black inline truncate"
                  style="max-width: 18ch"
                >
                  {{ getRepoName(repo.url) }}
                </a>
              </div>
              <p class="text-small text-gray-400">
                {{ moment(repo.dateStart).format('MMM YYYY') }} → {{ moment(repo.dateEnd).format('MMM YYYY') }}
              </p>
            </article>
          </section>
        </div>
      </section>
    </div>
  </el-popover>
</template>

<script setup lang="ts">
import LfBadge from '@/ui-kit/badge/Badge.vue';
import { CrowdIntegrations } from '@/integrations/integrations-config';
import { ContributorMaintainerRole } from '@/modules/contributor/types/Contributor';
import { computed } from 'vue';
import moment from 'moment';

const props = defineProps<{
  maintainerRoles: ContributorMaintainerRole[],
  showProjects?: boolean,
}>();

const getPlatform = (platform: string) => CrowdIntegrations.getConfig(platform);

const currentRepos = computed<ContributorMaintainerRole[]>(() => props.maintainerRoles.filter((role) => !role.dateEnd));
const previousRepos = computed<ContributorMaintainerRole[]>(() => props.maintainerRoles.filter((role) => !!role.dateEnd));

const segmentIds = computed<string[]>(() => props.maintainerRoles.map((role) => role.segmentId));

const getRepoName = (url: string) => url.split('/').pop();
const getSegmentName = (segmentId) => {
  const role: ContributorMaintainerRole = props.maintainerRoles.find((r) => r.segmentId === segmentId);
  return role?.segmentName;
};
</script>

<script lang="ts">
export default {
  name: 'LfContributorDetailsProjectsMaintainerItem',
};
</script>

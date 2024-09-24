<template>
  <div class="flex items-center gap-1">
    <el-popover v-if="isMaintainer" placement="top" width="20rem">
      <template #reference>
        <lf-badge
          type="secondary"
          class="!flex items-center gap-1"
        >
          <span>Maintainer</span>
          <lf-icon name="git-repository-line" :size="14" class="text-gray-400" />
          <span class="text-gray-400">4/6</span>
        </lf-badge>
      </template>
      <div class="p-1 flex flex-col gap-6">
        <section>
          <p class="text-small font-semibold text-gray-400 pb-4">
            Repositories
          </p>
          <div class="flex flex-col gap-4">
            <article class="flex items-center justify-between">
              <div class="flex items-center gap-1">
                <lf-icon name="git-repository-line" :size="16" class="text-gray-500" />
                <a
                  href="https://github.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  class="cursor-pointer text-small leading-5 underline decoration-dashed text-gray-500
             decoration-gray-500 underline-offset-4 hover:decoration-gray-900 hover:!text-black inline truncate"
                  style="max-width: 18ch"
                >
                  Repository name
                </a>
              </div>
              <p class="text-small text-gray-400">
                since Apr 2022
              </p>
            </article>
            <article class="flex items-center justify-between">
              <div class="flex items-center gap-1">
                <lf-icon name="git-repository-line" :size="16" class="text-gray-500" />
                <a
                  href="https://github.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  class="cursor-pointer text-small leading-5 underline decoration-dashed text-gray-500
             decoration-gray-500 underline-offset-4 hover:decoration-gray-900 hover:!text-black inline truncate"
                  style="max-width: 18ch"
                >
                  Repository name
                </a>
              </div>
              <p class="text-small text-gray-400">
                since Apr 2022
              </p>
            </article>
          </div>
        </section>
        <section>
          <p class="text-small font-semibold text-gray-400 pb-4">
            Previously
          </p>
          <div class="flex flex-col gap-4">
            <article class="flex items-center justify-between">
              <div class="flex items-center gap-1">
                <lf-icon name="git-repository-line" :size="16" class="text-gray-500" />
                <a
                  href="https://github.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  class="cursor-pointer text-small leading-5 underline decoration-dashed text-gray-500
             decoration-gray-500 underline-offset-4 hover:decoration-gray-900 hover:!text-black inline truncate"
                  style="max-width: 18ch"
                >
                  Repository name
                </a>
              </div>
              <p class="text-small text-gray-400">
                Apr 2020 → Jan 2024
              </p>
            </article>
          </div>
        </section>
      </div>
    </el-popover>

    <!-- Contributor -->
    <el-tooltip
      v-else-if="isContributor"
      content="Since Apr 2023"
      placement="top"
    >
      <lf-badge
        type="secondary"
      >
        Contributor
      </lf-badge>
    </el-tooltip>
  </div>
</template>

<script setup lang="ts">
import LfIcon from '@/ui-kit/icon/Icon.vue';
import LfBadge from '@/ui-kit/badge/Badge.vue';

const props = defineProps<{
  project: any,
}>();

const isMaintainer = props.project !== undefined;
const isContributor = true;
</script>

<script lang="ts">
export default {
  name: 'LfContributorDetailsProjectsMaintainer',
};
</script>

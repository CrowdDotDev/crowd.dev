<template>
  <div class="flex justify-between items-center pb-6">
    <h6 class="text-h6">
      Emails
    </h6>
    <lf-button
      type="secondary"
      size="small"
      :icon-only="true"
      @click="edit = true"
    >
      <lf-icon name="pencil-line" />
    </lf-button>
  </div>
  <div class="flex flex-col gap-4">
    <article
      v-for="email of emails(props.contributor)"
      :key="email.value"
      class="flex items-start"
    >
      <lf-icon name="mail-line mt-0.5" :size="20" />
      <div class="pl-3">
        <div class="flex items-center">
          <a
            :href="`mailto:${email.value}`"
            target="_blank"
            rel="noopener noreferrer"
            class="text-medium cursor-pointer !text-black underline decoration-dashed
             decoration-gray-400 underline-offset-4 hover:decoration-gray-900"
          >
            {{ email.value }}
          </a>
          <lf-icon
            v-if="email.verified"
            name="verified-badge-line"
            :size="16"
            class="ml-1 text-primary-500"
          />
          <div v-if="CrowdIntegrations.getPlatformsLabel(email.platforms)" class="ml-2 flex items-center">
            <el-tooltip placement="top">
              <template #content>
                <span class="font-semibold">Source:&nbsp;</span>{{ CrowdIntegrations.getPlatformsLabel(email.platforms) }}
              </template>
              <i class="ri-shining-line text-sm" :class="isEnrichment(email.platforms) ? 'text-purple-400' : 'text-gray-400'" />
            </el-tooltip>
          </div>
        </div>
        <p class="text-tiny text-gray-400 pt-1.5">
          Source: {{ CrowdIntegrations.getPlatformsLabel(email.platforms) }}
        </p>
      </div>
    </article>
  </div>
  <app-member-manage-emails-drawer
    v-if="edit"
    v-model="edit"
    :member="props.contributor"
    @update:model-value="emit('reload')"
  />
</template>

<script setup lang="ts">
import LfIcon from '@/ui-kit/icon/Icon.vue';
import { Contributor } from '@/modules/contributor/types/Contributor';
import { CrowdIntegrations } from '@/integrations/integrations-config';
import useContributorHelpers from '@/modules/contributor/helpers/contributor.helpers';
import LfButton from '@/ui-kit/button/Button.vue';
import { ref } from 'vue';
import AppMemberManageEmailsDrawer from '@/modules/member/components/member-manage-emails-drawer.vue';

const props = defineProps<{
  contributor: Contributor,
}>();

const emit = defineEmits<{(e: 'reload'): any}>();

const { emails } = useContributorHelpers();

const edit = ref<boolean>(false);

const isEnrichment = (platforms:string[]) => platforms.includes('enrichment');
</script>

<script lang="ts">
export default {
  name: 'LfContributorDetailsEmails',
};
</script>

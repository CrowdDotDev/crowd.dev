<template>
  <div class="flex justify-between items-center pb-6">
    <h6 class="text-h6">
      Emails
    </h6>
    <lf-button
      v-if="hasPermission(LfPermission.memberEdit)"
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
      <lf-tooltip content="Email">
        <lf-icon name="mail-line mt-0.5" :size="20" />
      </lf-tooltip>
      <div class="pl-3">
        <div class="flex items-center">
          <lf-tooltip class="flex" :content="email.value" :disabled="email.value.length <= 25">
            <a
              :href="`mailto:${email.value}`"
              target="_blank"
              rel="noopener noreferrer"
              class="text-medium cursor-pointer !text-black underline decoration-dashed
             decoration-gray-400 underline-offset-4 hover:decoration-gray-900 truncate"
              style="max-width: 25ch"
            >
              {{ email.value }}
            </a>
          </lf-tooltip>

          <lf-tooltip v-if="email.verified" content="Verified identity">
            <lf-icon
              name="verified-badge-line"
              :size="16"
              class="ml-1 text-primary-500"
            />
          </lf-tooltip>
        </div>
        <p class="text-tiny text-gray-400 pt-1.5">
          Source: {{ CrowdIntegrations.getPlatformsLabel(email.platforms) }}
        </p>
      </div>
    </article>
    <div v-if="emails(props.contributor).length === 0" class="pt-2 flex flex-col items-center">
      <lf-icon name="mail-line" :size="40" class="text-gray-300" />
      <p class="text-center pt-3 text-medium text-gray-400">
        No emails
      </p>
    </div>
  </div>
  <app-member-manage-emails-drawer
    v-if="edit"
    v-model="edit"
    :member="props.contributor"
    @reload="emit('reload')"
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
import LfTooltip from '@/ui-kit/tooltip/Tooltip.vue';
import { LfPermission } from '@/shared/modules/permissions/types/Permissions';
import usePermissions from '@/shared/modules/permissions/helpers/usePermissions';

const props = defineProps<{
  contributor: Contributor,
}>();

const emit = defineEmits<{(e: 'reload'): any}>();

const { hasPermission } = usePermissions();

const { emails } = useContributorHelpers();

const edit = ref<boolean>(false);
</script>

<script lang="ts">
export default {
  name: 'LfContributorDetailsEmails',
};
</script>

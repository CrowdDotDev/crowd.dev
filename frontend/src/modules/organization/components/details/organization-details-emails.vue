<template>
  <section v-bind="$attrs">
    <div class="flex justify-between items-center pb-6">
      <h6 class="text-h6">
        Emails
      </h6>
      <lf-button
        v-if="hasPermission(LfPermission.organizationEdit)"
        type="secondary"
        size="small"
        :icon-only="true"
        @click="edit = true"
      >
        <lf-icon name="pencil-line" />
      </lf-button>
    </div>

    <div class="flex flex-wrap gap-3">
      <article
        v-for="email of emailList.slice(0, showMore ? emailList.length : limit)"
        :key="email.value"
        class="flex"
      >
        <lf-icon name="mail-line" :size="20" class="text-gray-500" />
        <div class="pl-2">
          <div class="flex items-center">
            <lf-tooltip
              :content="email.value"
              :disabled="email.value.length < 25"
            >
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

          <p v-if="platformLabel(email.platforms)" class="mt-1.5 text-tiny text-gray-400">
            Source: {{ platformLabel(email.platforms) }}
          </p>
        </div>
      </article>
    </div>
    <div>
      <div v-if="emailList.length === 0" class="pt-2 flex flex-col items-center w-full">
        <lf-icon name="at-line" :size="40" class="text-gray-300" />
        <p class="text-center pt-3 text-medium text-gray-400">
          No emails
        </p>
      </div>
    </div>

    <lf-button
      v-if="emailList.length > limit"
      type="primary-link"
      size="medium"
      class="mt-6"
      @click="showMore = !showMore"
    >
      Show {{ showMore ? 'less' : 'more' }}
    </lf-button>
  </section>
  <app-organization-manage-emails-drawer
    v-if="edit"
    v-model="edit"
    :organization="props.organization"
    @unmerge="unmerge"
    @reload="emit('reload')"
  />
  <app-organization-unmerge-dialog
    v-if="isUnmergeDialogOpen"
    v-model="isUnmergeDialogOpen"
    :selected-identity="selectedIdentity"
  />
</template>

<script setup lang="ts">
import LfButton from '@/ui-kit/button/Button.vue';
import LfIcon from '@/ui-kit/icon/Icon.vue';
import { computed, ref } from 'vue';
import { LfPermission } from '@/shared/modules/permissions/types/Permissions';
import usePermissions from '@/shared/modules/permissions/helpers/usePermissions';
import useOrganizationHelpers from '@/modules/organization/helpers/organization.helpers';
import { Organization } from '@/modules/organization/types/Organization';
import AppOrganizationManageEmailsDrawer from '@/modules/organization/components/organization-manage-emails-drawer.vue';
import LfTooltip from '@/ui-kit/tooltip/Tooltip.vue';
import { CrowdIntegrations } from '@/integrations/integrations-config';
import AppOrganizationUnmergeDialog from '@/modules/organization/components/organization-unmerge-dialog.vue';

const props = defineProps<{
  organization: Organization,
}>();

const limit = 10;

const emit = defineEmits<{(e: 'reload'): any}>();

const { hasPermission } = usePermissions();

const { emails } = useOrganizationHelpers();

const emailList = computed(() => emails(props.organization));

const showMore = ref<boolean>(false);
const edit = ref<boolean>(false);
const isUnmergeDialogOpen = ref(null);
const selectedIdentity = ref(null);
const platformLabel = (platforms: string[]) => CrowdIntegrations.getPlatformsLabel(platforms);

const unmerge = (identity: any) => {
  if (identity) {
    selectedIdentity.value = identity;
  }
  isUnmergeDialogOpen.value = props.organization as any;
};
</script>

<script lang="ts">
export default {
  name: 'LfOrganizationDetailsEmails',
};
</script>

<template>
  <article class="flex items-center">
    <div class="flex-grow">
      <el-input
        v-model="model.email"
        placeholder="johndoe@gmail.com"
        class="!h-8"
      >
        <template #suffix>
          <div v-if="model.email === props.email.value && props.email.value">
            <div class="flex items-center gap-2">
              <el-tooltip v-if="platformLabel(props.email.platforms)" placement="top-end">
                <template #content>
                  <span class="font-semibold">Source:&nbsp;</span>{{ platformLabel(props.email.platforms) }}
                </template>
                <i class="ri-shining-fill text-sm" :class="isEnrichment(props.email.platforms) ? 'text-purple-400' : 'text-gray-300'" />
              </el-tooltip>
              <div v-if="model.email === props.email.value && props.email.value">
                <i
                  v-if="model.email && props.email.verified"
                  class="ri-verified-badge-fill text-primary-500 text-base leading-4"
                />
              </div>
            </div>
          </div>

          <div v-if="model.email !== props.email.value || !props.email.value" class="flex gap-1 -mr-1">
            <lf-button
              size="tiny"
              :icon-only="true"
              :disabled="model.email === props.email.value"
              @click="update()"
            >
              <i class="ri-check-fill" />
            </lf-button>
            <lf-button
              size="tiny"
              type="secondary"
              :icon-only="true"
              @click="clear()"
            >
              <i class="ri-close-line" />
            </lf-button>
          </div>
        </template>
      </el-input>
    </div>

    <lf-dropdown placement="bottom-end" width="15rem" class="ml-3">
      <template #trigger>
        <lf-button
          type="tertiary-light-gray"
          size="small"
          :icon-only="true"
          class="relative"
          :disabled="props.actionsDisabled"
        >
          <i
            class="ri-more-fill"
          />
        </lf-button>
      </template>
      <el-tooltip
        content="Not possible to unmerge an unsaved identity"
        placement="top-end"
        :disabled="model.email === props.email.value"
      >
        <lf-dropdown-item
          :disabled="model.email !== props.email.value"
          @click="emit('unmerge', props.email)"
        >
          <i class="ri-link-unlink" />
          Unmerge email
        </lf-dropdown-item>
      </el-tooltip>
      <lf-dropdown-separator />
      <lf-dropdown-item type="danger" @click="emit('remove')">
        <i class="ri-delete-bin-6-line" />
        Delete email
      </lf-dropdown-item>
    </lf-dropdown>
  </article>
</template>
<script setup lang="ts">
import LfButton from '@/ui-kit/button/Button.vue';
import LfDropdown from '@/ui-kit/dropdown/Dropdown.vue';
import LfDropdownItem from '@/ui-kit/dropdown/DropdownItem.vue';
import {
  Organization,
  OrganizationIdentity,
} from '@/modules/organization/types/Organization';
import { CrowdIntegrations } from '@/integrations/integrations-config';
import LfDropdownSeparator from '@/ui-kit/dropdown/DropdownSeparator.vue';
import { ref } from 'vue';

const emit = defineEmits<{(e: 'update', value: Partial<OrganizationIdentity>): void,
  (e: 'unmerge', value: Partial<OrganizationIdentity>): void,
  (e: 'remove'): void,
  (e: 'clear'): void}>();

const props = withDefaults(defineProps<{
  email: OrganizationIdentity,
  organization: Organization,
  actionsDisabled?: boolean,
}>(), {
  actionsDisabled: false,
});

const model = ref({
  email: props.email.value,
});

const platformLabel = (platforms: string[]) => CrowdIntegrations.getPlatformsLabel(platforms);
const isEnrichment = (platforms?: string[]) => (platforms || []).includes('enrichment');

const update = () => {
  emit('update', {
    value: model.value.email,
  });
};

const clear = () => {
  model.value.email = props.email.value;
  emit('clear');
};
</script>
<script lang="ts">
export default {
  name: 'AppOrganizationFormEmailItem',
};
</script>

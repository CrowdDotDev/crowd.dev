<template>
  <article class="flex items-center">
    <div class="flex-grow">
      <div class="el-form-item mb-0" :class="{ 'is-error': emailExists && !(model.value === props.identity.value && props.identity.value) }">
        <div class="el-form-item__content flex-col items-start">
          <el-input
            v-model="model.value"
            placeholder="johndoe@gmail.com"
            class="!h-8"
          >
            <template #suffix>
              <div v-if="model.value === props.identity.value && props.identity.value">
                <div class="flex items-center gap-2">
                  <el-tooltip v-if="getPlatformLabel(props.identity.platforms)" placement="top-end">
                    <template #content>
                      <span class="font-semibold">Source:&nbsp;</span>{{ getPlatformLabel(props.identity.platforms) }}
                    </template>
                    <i class="ri-shining-fill text-sm" :class="isEnrichment(props.identity.platforms) ? 'text-purple-400' : 'text-gray-300'" />
                  </el-tooltip>
                  <i
                    v-if="model.value && props.identity.verified"
                    class="ri-verified-badge-fill text-brand-500 text-base leading-4"
                  />
                </div>
              </div>
              <div v-else class="flex gap-1 -mr-1">
                <cr-button
                  size="tiny"
                  :icon-only="true"
                  :disabled="model.value === props.identity.value || $v.$invalid || emailExists"
                  @click="update()"
                >
                  <i class="ri-check-fill" />
                </cr-button>
                <cr-button
                  size="tiny"
                  type="secondary"
                  :icon-only="true"
                  @click="clear()"
                >
                  <i class="ri-close-line" />
                </cr-button>
              </div>
            </template>
          </el-input>
          <div
            v-if="emailExists && !(model.value === props.identity.value && props.identity.value)"
            class="el-form-item__error"
          >
            This email is already associated with the contributor
          </div>
        </div>
      </div>
    </div>
    <cr-dropdown placement="bottom-end" width="15rem" class="ml-3">
      <template #trigger>
        <cr-button
          type="tertiary-light-gray"
          size="small"
          :icon-only="true"
          class="relative"
          :disabled="props.actionsDisabled"
        >
          <i
            class="ri-more-fill"
          />
        </cr-button>
      </template>

      <cr-dropdown-item
        v-if="!props.identity.verified"
        @click="verify(true)"
      >
        <i class="ri-verified-badge-line" />
        Verify identity
      </cr-dropdown-item>
      <el-tooltip
        v-else
        content="Emails tracked from Integrations can’t be unverified"
        placement="top-end"
        :disabled="!props.identity.sourceId"
      >
        <cr-dropdown-item
          @click="verify(false)"
        >
          <app-svg name="unverify" class="!h-4 !w-4" />
          Unverify email
        </cr-dropdown-item>
      </el-tooltip>

      <cr-dropdown-separator />
      <cr-dropdown-item type="danger" @click="emit('remove')">
        <i class="ri-delete-bin-6-line" />
        Delete email
      </cr-dropdown-item>
    </cr-dropdown>
  </article>
</template>

<script setup lang="ts">
import {
  computed,
  ref,
} from 'vue';
import { Member, MemberIdentity } from '@/modules/member/types/Member';
import CrButton from '@/ui-kit/button/Button.vue';
import CrDropdown from '@/ui-kit/dropdown/Dropdown.vue';
import CrDropdownItem from '@/ui-kit/dropdown/DropdownItem.vue';
import CrDropdownSeparator from '@/ui-kit/dropdown/DropdownSeparator.vue';
import AppSvg from '@/shared/svg/svg.vue';
import useVuelidate from '@vuelidate/core';
import { email } from '@vuelidate/validators';
import { CrowdIntegrations } from '@/integrations/integrations-config';

const emit = defineEmits<{(e: 'update', value: Partial<MemberIdentity>): void,
  (e: 'remove'): void,
  (e: 'clear'): void}>();

export interface MemberIdentityEdit extends MemberIdentity{
  platforms?: string[]
}

const props = withDefaults(defineProps<{
  identity: MemberIdentityEdit,
  member: Member,
  actionsDisabled?: boolean,
}>(), {
  actionsDisabled: false,
});

const model = ref({ ...props.identity });

const rules = {
  value: {
    email,
  },
};

const $v = useVuelidate(rules, model);

const update = () => {
  emit('update', {
    value: model.value.value,
  });
};

const clear = () => {
  model.value.value = props.identity.value;
  emit('clear');
};

const verify = (verified: boolean) => {
  emit('update', {
    verified,
  });
};

const isEnrichment = (platforms?: string[]) => (platforms || []).includes('enrichment');

const getPlatformLabel = (platforms?: string[]) => (platforms || [])
  .filter((platform) => !['integration_or_enrichment'].includes(platform))
  .map((platform) => {
    if (platform === 'lfid') {
      return 'LFID';
    }
    if (platform === 'integration') {
      return 'Integration';
    }
    if (platform === 'enrichment') {
      return 'Enrichment';
    }
    return CrowdIntegrations.getConfig(platform)?.name || platform;
  }).join(', ');

const emailExists = computed(() => (props.member.identities || [])
  .filter((i) => i.type === 'email')
  .some((i) => i.value === model.value.value && i.platform === model.value.platform));
</script>

<script lang="ts">
export default {
  name: 'AppMemberFormEmailItem',
};
</script>

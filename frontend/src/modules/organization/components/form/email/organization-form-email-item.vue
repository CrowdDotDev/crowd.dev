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
                  <i
                    v-if="model.value && props.identity.verified"
                    class="ri-verified-badge-fill text-primary-500 text-base leading-4"
                  />
                </div>
              </div>
              <div v-else class="flex gap-1 -mr-1">
                <lf-button
                  size="tiny"
                  :icon-only="true"
                  :disabled="model.value === props.identity.value || $v.$invalid || emailExists"
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
          <div
            v-if="emailExists && !(model.value === props.identity.value && props.identity.value)"
            class="el-form-item__error"
          >
            This email is already associated with the contributor
          </div>
        </div>
      </div>
    </div>
    <lf-dropdown placement="bottom-end" width="15rem" class="ml-3">
      <template #trigger>
        <lf-button
          type="secondary-ghost-light"
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

      <lf-dropdown-item
        v-if="!props.identity.verified"
        @click="verify(true)"
      >
        <i class="ri-verified-badge-line" />
        Verify identity
      </lf-dropdown-item>
      <el-tooltip
        v-else
        content="Emails tracked from Integrations can’t be unverified"
        placement="top-end"
        :disabled="!props.identity.sourceId"
      >
        <lf-dropdown-item
          @click="verify(false)"
        >
          <app-svg name="unverify" class="!h-4 !w-4" />
          Unverify email
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
import {
  computed,
  ref,
} from 'vue';
import LfButton from '@/ui-kit/button/Button.vue';
import LfDropdown from '@/ui-kit/dropdown/Dropdown.vue';
import LfDropdownItem from '@/ui-kit/dropdown/DropdownItem.vue';
import LfDropdownSeparator from '@/ui-kit/dropdown/DropdownSeparator.vue';
import AppSvg from '@/shared/svg/svg.vue';
import useVuelidate from '@vuelidate/core';
import { email } from '@vuelidate/validators';
import { Organization, OrganizationIdentity } from '@/modules/organization/types/Organization';

const emit = defineEmits<{(e: 'update', value: Partial<OrganizationIdentity>): void,
  (e: 'remove'): void,
  (e: 'clear'): void}>();

const props = withDefaults(defineProps<{
  identity: OrganizationIdentity,
  organization: Organization,
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

const emailExists = computed(() => (props.organization.identities || [])
  .filter((i) => i.type === 'email')
  .some((i) => i.value === model.value.value && i.platform === model.value.platform));
</script>

<script lang="ts">
export default {
  name: 'AppOrganizationFormEmailItem',
};
</script>

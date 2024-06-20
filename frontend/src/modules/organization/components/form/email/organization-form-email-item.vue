<template>
  <article class="flex items-center">
    <div class="flex-grow">
      <el-input
        v-model="model.email"
        placeholder="johndoe@gmail.com"
        class="!h-8"
      >
        <template #suffix>
          <div v-if="model.email !== props.email || !props.email" class="flex gap-1 -mr-1">
            <lf-button
              size="tiny"
              :icon-only="true"
              :disabled="model.email === props.email || $v.$invalid"
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
      <lf-dropdown-item type="danger" @click="emit('remove')">
        <i class="ri-delete-bin-6-line" />
        Delete email
      </lf-dropdown-item>
    </lf-dropdown>
  </article>
</template>
<script setup lang="ts">
import {
  ref,
} from 'vue';
import LfButton from '@/ui-kit/button/Button.vue';
import LfDropdown from '@/ui-kit/dropdown/Dropdown.vue';
import LfDropdownItem from '@/ui-kit/dropdown/DropdownItem.vue';
import { Organization } from '@/modules/organization/types/Organization';
import { email } from '@vuelidate/validators';
import useVuelidate from '@vuelidate/core';

const emit = defineEmits<{(e: 'update', value: string): void,
  (e: 'remove'): void,
  (e: 'clear'): void}>();

const props = withDefaults(defineProps<{
  email: string,
  organization: Organization,
  actionsDisabled?: boolean,
}>(), {
  actionsDisabled: false,
});

const model = ref({
  email: props.email,
});

const rules = {
  email: {
    email,
  },
};

const $v = useVuelidate(rules, model);
const update = () => {
  emit('update', model.value.email);
};

const clear = () => {
  model.value.email = props.email;
  emit('clear');
};
</script>
<script lang="ts">
export default {
  name: 'AppOrganizationFormEmailItem',
};
</script>

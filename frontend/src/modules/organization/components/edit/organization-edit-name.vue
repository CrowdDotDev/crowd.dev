<template>
  <lf-conteneditable
    v-model="form.name"
    class="px-1 py-px font-secondary text-h5 rounded-md font-semibold transition mb-1
    border border-transparent edit-name w-min
    hover:!bg-gray-200 group-hover:bg-gray-100
    focus:!bg-white focus:border-gray-900"
    style="max-width: 30ch"
    :class="form.name.length <= 30 ? 'focus:whitespace-nowrap' : 'focus:whitespace-normal focus:w-full'"
    @blur="update"
  />
</template>

<script setup lang="ts">
import LfConteneditable from '@/ui-kit/contenteditable/Contenteditable.vue';
import { reactive } from 'vue';
import Message from '@/shared/message/message';
import { required } from '@vuelidate/validators';
import useVuelidate from '@vuelidate/core';
import { Organization } from '@/modules/organization/types/Organization';
import { useOrganizationStore } from '@/modules/organization/store/pinia';

const props = defineProps<{
  organization: Organization,
}>();

const { updateOrganization } = useOrganizationStore();

const form = reactive({
  name: props.organization.displayName,
});

const rules = {
  name: {
    required,
  },
};

const $v = useVuelidate(rules, form);

const update = () => {
  if (form.name === props.organization.displayName) {
    return;
  }
  if ($v.value.$invalid) {
    form.name = props.organization.displayName;
    return;
  }
  updateOrganization(props.organization.id, {
    displayName: form.name,
  })
    .then(() => {
      Message.success('Organization name updated successfully!');
    })
    .catch(() => {
      Message.error('There was an error updating organization');
    });
};
</script>

<script lang="ts">
export default {
  name: 'LfOrganizationEditName',
};
</script>

<style lang="scss">
.edit-name {
  &:not(:focus){
    @apply truncate;
  }
}
</style>

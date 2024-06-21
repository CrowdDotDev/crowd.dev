<template>
  <lf-conteneditable
    v-model="form.name"
    class="px-1 py-px font-secondary text-h5 rounded-md font-semibold transition mb-1
    border border-transparent
    hover:!bg-gray-200 group-hover:bg-gray-100
    focus:!bg-white focus:border-gray-900"
    @blur="update"
  />
</template>

<script setup lang="ts">
import { Contributor } from '@/modules/contributor/types/Contributor';
import LfConteneditable from '@/ui-kit/contenteditable/Contenteditable.vue';
import { reactive } from 'vue';
import Message from '@/shared/message/message';
import { useContributorStore } from '@/modules/contributor/store/contributor.store';
import { required } from '@vuelidate/validators';
import useVuelidate from '@vuelidate/core';

const props = defineProps<{
  contributor: Contributor,
}>();

const { updateContributor } = useContributorStore();

const form = reactive({
  name: props.contributor.displayName,
});

const rules = {
  name: {
    required,
  },
};

const $v = useVuelidate(rules, form);

const update = () => {
  if (form.name === props.contributor.displayName) {
    return;
  }
  if ($v.value.$invalid) {
    form.name = props.contributor.displayName;
    return;
  }
  updateContributor(props.contributor.id, {
    displayName: form.name,
  }).then(() => {
    Message.success('Contributor name updated successfully!');
  });
};
</script>

<script lang="ts">
export default {
  name: 'LfContributorEditName',
};
</script>

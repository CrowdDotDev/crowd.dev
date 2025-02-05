<template>
  <lf-modal v-model="isModalOpen">
    <!-- Header -->
    <section class="py-4 pr-4 pl-6 flex justify-between items-center">
      <h5>Add Collection</h5>
      <lf-button type="secondary-ghost-light" :icon-only="true" @click="isModalOpen = false">
        <lf-icon name="xmark" />
      </lf-button>
    </section>

    <!-- Body -->

    <!-- Footer -->
    <section class="border-t border-gray-100 py-4 px-6 gap-4 flex justify-end  z-40">
      <lf-button type="secondary-ghost" @click="isModalOpen = false">
        Cancel
      </lf-button>
      <lf-button type="primary">
        Add Collection
      </lf-button>
    </section>
  </lf-modal>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import LfModal from '@/ui-kit/modal/Modal.vue';
import LfButton from '@/ui-kit/button/Button.vue';
import LfIcon from '@/ui-kit/icon/Icon.vue';

const props = defineProps<{
    modelValue: boolean,
}>();

const emit = defineEmits<{(e: 'update:modelValue', value: boolean): void }>();

const isModalOpen = computed({
  get: () => props.modelValue,
  set: (value) => emit('update:modelValue', value),
});

</script>

<script lang="ts">
export default {
  name: 'LfCollectionAdd',
};
</script>

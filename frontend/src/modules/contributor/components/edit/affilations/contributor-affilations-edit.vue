<template>
  <lf-modal v-model="isModalOpen" width="60rem">
    <section class="px-6 pt-4">
      <div class="flex items-center justify-between pb-1.5">
        <h5>
          Activities affiliation
        </h5>
        <lf-button type="secondary-ghost-light" :icon-only="true">
          <lf-icon name="close-line" />
        </lf-button>
      </div>
      <p class="text-gray-500 text-medium">
        Manage the affiliation between activities and organizations on behalf of a project over a specific time
        period.<br>
        By default, activities are affiliated with organizations based on the duration of the work experience.<br>
        <br>
        <span class="font-semibold">Important note:</span> Work history updates won’t override manual changes to
        activities affiliations.
      </p>
    </section>
    <section class="px-6 pt-6 pb-10">
      <div class="flex">
        <div class="w-1/3 py-2">
          <p class="text-medium font-semibold text-gray-400">
            Project
          </p>
        </div>
        <div class="w-2/3 py-2">
          <p class="text-medium font-semibold text-gray-400">
            Affiliation & period
          </p>
        </div>
      </div>
      <article class="flex items-center border-t border-gray-100 py-4">
        <div class="w-1/3 py-2">
          <p class="text-medium font-semibold">
            Open Review Initiative
          </p>
        </div>
        <div class="w-2/3 py-2">
          <lf-button type="primary-link" size="small">
            <lf-icon name="add-line" />
            Add affiliation
          </lf-button>
        </div>
      </article>
    </section>
    <footer class="border-t border-gray-100 px-6 py-4 flex justify-end gap-4">
      <lf-button type="secondary-ghost">
        Cancel
      </lf-button>
      <lf-button type="primary">
        Update activities affiliation
      </lf-button>
    </footer>
  </lf-modal>
</template>

<script setup lang="ts">
import LfModal from '@/ui-kit/modal/Modal.vue';
import { useContributorStore } from '@/modules/contributor/store/contributor.store';
import { Contributor } from '@/modules/contributor/types/Contributor';
import { computed } from 'vue';
import LfTable from '@/ui-kit/table/Table.vue';
import LfButton from '@/ui-kit/button/Button.vue';
import LfIcon from '@/ui-kit/icon/Icon.vue';

const props = defineProps<{
  modelValue: boolean,
  contributor: Contributor,
}>();

const emit = defineEmits<{(e: 'update:modelValue', value: boolean): void }>();

const { updateContributor } = useContributorStore();

const isModalOpen = computed<boolean>({
  get() {
    return props.modelValue;
  },
  set(value: boolean) {
    emit('update:modelValue', value);
  },
});

</script>

<script lang="ts">
export default {
  name: 'LfContributorEditAffilations',
};
</script>

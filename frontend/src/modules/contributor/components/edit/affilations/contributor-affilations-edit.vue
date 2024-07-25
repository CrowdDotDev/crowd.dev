<template>
  <lf-modal v-model="isModalOpen" width="60rem">
    <section class="px-6 pt-4">
      <div class="flex items-center justify-between pb-1.5">
        <h5>
          Activities affiliation
        </h5>
        <lf-button type="secondary-ghost-light" :icon-only="true" @click="isModalOpen = false">
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
    <section class="px-6 pt-6">
      <div class="flex border-b border-gray-100">
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

      <lf-scroll-shadow class="max-h-120 -mx-6 px-6">
        <div class="pb-10">
          <article
            v-for="subproject of props.contributor.segments"
            :key="subproject.id"
            class="flex items-center border-t border-gray-100 first:border-none py-4"
          >
            <div class="w-1/3 py-2">
              <p class="text-medium font-semibold">
                {{ subproject.name }}
              </p>
            </div>
            <div class="w-2/3 py-2">
              <div class="flex flex-col gap-4 items-start">
                <template
                  v-for="(affiliation, ai) of form"
                  :key="`${subproject.id}-${ai}`"
                >
                  <template v-if="affiliation.segmentId === subproject.id">
                    <lf-contributor-edit-affilations-item
                      v-model="form[ai]"
                      :contributor="props.contributor"
                    >
                      <lf-button
                        type="secondary-ghost"
                        class="ml-2"
                        :icon-only="true"
                        @click="form.splice(ai, 1)"
                      >
                        <lf-icon name="delete-bin-6-line" />
                      </lf-button>
                    </lf-contributor-edit-affilations-item>
                  </template>
                </template>

                <lf-button
                  type="primary-link"
                  size="small"
                  :disabled="isProjectInvalid(subproject.id)"
                  @click="addAffiliation(subproject.id)"
                >
                  <lf-icon name="add-line" />
                  Add affiliation
                </lf-button>
              </div>
            </div>
          </article>
        </div>
      </lf-scroll-shadow>
    </section>
    <footer class="border-t border-gray-100 px-6 py-4 flex justify-end gap-4">
      <lf-button type="secondary-ghost" @click="isModalOpen = false">
        Cancel
      </lf-button>
      <lf-button type="primary" :disabled="$v.$invalid" @click="submit()">
        Update activities affiliation
      </lf-button>
    </footer>
  </lf-modal>
</template>

<script setup lang="ts">
import LfModal from '@/ui-kit/modal/Modal.vue';
import { useContributorStore } from '@/modules/contributor/store/contributor.store';
import { Contributor } from '@/modules/contributor/types/Contributor';
import { computed, onMounted, ref } from 'vue';
import LfButton from '@/ui-kit/button/Button.vue';
import LfIcon from '@/ui-kit/icon/Icon.vue';
import LfContributorEditAffilationsItem
, { AffilationForm } from '@/modules/contributor/components/edit/affilations/contributor-affilations-edit-item.vue';
import LfScrollShadow from '@/ui-kit/scrollshadow/ScrollShadow.vue';
import useVuelidate from '@vuelidate/core';
import Message from '@/shared/message/message';
import moment from 'moment';

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

const form = ref<AffilationForm[]>([]);

const $v = useVuelidate({}, form);

const addAffiliation = (subprojectId: string) => {
  form.value.push({
    segmentId: subprojectId,
    organization: null,
    dateStart: '',
    dateEnd: '',
    currentlyAffiliated: false,
  });
};

const sending = ref<boolean>(false);

const submit = () => {
  if ($v.value.$invalid) {
    return;
  }
  const data = {
    affiliations: form.value.map((affiliation) => ({
      memberId: props.contributor.id,
      segmentId: affiliation.segmentId,
      organizationId: affiliation.organization,
      dateStart: affiliation.dateStart
        ? moment(affiliation.dateStart).startOf('month').format('YYYY-MM-DDTHH:mm:ss.SSS[Z]')
        : undefined,
      dateEnd: !affiliation.currentlyAffiliated && affiliation.dateEnd
        ? moment(affiliation.dateEnd).startOf('month').format('YYYY-MM-DDTHH:mm:ss.SSS[Z]')
        : undefined,
    })),
  };

  sending.value = true;

  updateContributor(props.contributor.id, data)
    .then(() => {
      Message.success('Activities affiliation updated successfully');
      isModalOpen.value = false;
    })
    .catch(() => {
      Message.error('Failed to update activities affiliation');
    })
    .finally(() => {
      sending.value = false;
    });
};

const isProjectInvalid = (projectId: string) => form.value.some((affiliation) => affiliation.segmentId === projectId
  && (!affiliation.dateStart || (!affiliation.currentlyAffiliated && !affiliation.dateEnd)));

onMounted(() => {
  form.value = props.contributor.affiliations.map((affiliation) => ({
    segmentId: affiliation.segmentId || '',
    organization: affiliation.organizationId || null,
    dateStart: affiliation.dateStart || '',
    dateEnd: affiliation.dateEnd || '',
    currentlyAffiliated: !affiliation.dateEnd && !!affiliation.dateStart,
  }));
});
</script>

<script lang="ts">
export default {
  name: 'LfContributorEditAffilations',
};
</script>

<template>
  <lf-modal v-model="isModalOpen">
    <!-- Header -->
    <section class="py-4 pr-4 pl-6 flex justify-between items-center">
      <h5>Add person</h5>
      <lf-button type="secondary-ghost-light" :icon-only="true" @click="isModalOpen = false">
        <lf-icon name="close-line" />
      </lf-button>
    </section>

    <!-- Subproject selection -->
    <section class="px-6 py-5 bg-primary-25">
      <div class="relative">
        <app-lf-sub-projects-list-dropdown
          @on-change="form.subproject = $event.subprojectId"
        />
      </div>
    </section>

    <!-- Form -->
    <section class="px-6 py-5 max-h-120 overflow-auto">
      <!-- Contributor name -->
      <article class="mb-5">
        <lf-field label-text="Name" :required="true">
          <lf-input v-model="form.name" />
        </lf-field>
      </article>

      <!-- Contributor email -->
      <article class="mb-5">
        <lf-field label-text="Email" :required="true">
          <lf-input v-model="form.email[0]" />
        </lf-field>
        <lf-button type="primary-link" size="small" class="mt-3">
          <lf-icon name="add-line" />
          Add another email
        </lf-button>
      </article>

      <article>
        <lf-field label-text="Identities">
          <div class="flex flex-col gap-2">
            <div v-for="(identity) of form.identities" :key="identity.platform">
              <lf-input v-model="identity.value" placeholder="...">
                <template #prefix>
                  <div class="flex items-center flex-nowrap whitespace-nowrap">
                    <div class="min-w-5">
                      <img :src="identity.image" class="h-5 w-5" :alt="identity.platform" />
                    </div>
                    <p
                      v-if="identity.prefix"
                      class="-mr-2 pl-2"
                      :class="identity.value?.length ? 'text-black' : 'text-gray-400'"
                    >
                      {{ identity.prefix }}
                    </p>
                  </div>
                </template>
              </lf-input>
            </div>
          </div>
        </lf-field>
      </article>
    </section>

    <section class="border-t border-gray-100 py-4 px-6 gap-4 flex justify-end contributor-add-footer">
      <lf-button type="secondary-ghost" @click="isModalOpen = false">
        Cancel
      </lf-button>
      <lf-button type="primary">
        Add person
      </lf-button>
    </section>
  </lf-modal>
</template>

<script setup lang="ts">
import LfModal from '@/ui-kit/modal/Modal.vue';
import { computed, reactive } from 'vue';
import LfButton from '@/ui-kit/button/Button.vue';
import LfIcon from '@/ui-kit/icon/Icon.vue';
import AppLfSubProjectsListDropdown from '@/modules/lf/segments/components/lf-sub-projects-list-dropdown.vue';
import LfInput from '@/ui-kit/input/Input.vue';
import LfField from '@/ui-kit/field/Field.vue';
import { CrowdIntegrations } from '@/integrations/integrations-config';
import { ContributorIdentity } from '@/modules/contributor/types/Contributor';

const props = defineProps<{
  modelValue: boolean,
}>();

const emit = defineEmits<{(e: 'update:modelValue', value: boolean): void}>();

const isModalOpen = computed({
  get: () => props.modelValue,
  set: (value) => emit('update:modelValue', value),
});

type ContributorAddIdentity = ContributorIdentity & {
  image: string,
  prefix: string,
}

const platformList: ContributorAddIdentity[] = Object.entries(CrowdIntegrations.memberIdentities)
  .map(([key, config]) => ({
    prefix: config.urlPrefix,
    image: config.image,
    platform: key,
    type: 'username',
    value: '',
    verified: true,
    sourceId: null,
  }));

interface ContributorAddForm {
  subproject: string;
  name: string;
  email: string[];
  identities: ContributorAddIdentity[];
}

const form = reactive<ContributorAddForm>({
  subproject: '',
  name: '',
  email: [''],
  identities: platformList,
});
</script>

<script lang="ts">
export default {
  name: 'LfContributorAdd',
};
</script>

<style lang="scss" scoped>
.contributor-add-footer{
  box-shadow: 0px -4px 8px 0px #0000000D;
}
</style>

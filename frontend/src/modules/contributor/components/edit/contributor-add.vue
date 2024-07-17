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
    <section class="relative">
      <div v-if="!form.subproject" class="absolute left-0 top-0 w-full h-full bg-white opacity-50 z-20" />
      <div class="px-6 py-5 max-h-120 overflow-auto contributor-form relative">
        <!-- Contributor name -->
        <article class="mb-5">
          <lf-field label-text="Name" :required="true">
            <lf-input
              v-model="form.name"
              class="h-10"
              :invalid="$v.name.$invalid && $v.name.$dirty"
              @blur="$v.name.$touch()"
              @change="$v.name.$touch()"
            />
            <lf-field-messages :validation="$v.name" :error-messages="{ required: 'This field is required' }" />
          </lf-field>
        </article>

        <!-- Contributor email -->
        <article class="mb-5">
          <lf-field label-text="Email address" :required="true">
            <div class="flex flex-col items-start gap-3">
              <lf-contributor-add-email-item
                v-for="(_, ei) of form.email"
                :key="`email:${ei}`"
                v-model="form.email[ei]"
                @blur="$v.email.$touch()"
              >
                <div v-if="form.email.length > 1">
                  <lf-button type="secondary-ghost-light" size="large" class="ml-2" :icon-only="true" @click="form.email.splice(ei, 1)">
                    <lf-icon name="delete-bin-6-line" />
                  </lf-button>
                </div>
              </lf-contributor-add-email-item>
            </div>
            <lf-field-messages :validation="$v.email" :error-messages="{ required: 'Enter at least one email', $each: '' }" />
          </lf-field>
          <lf-button type="primary-link" size="small" class="mt-3" @click="form.email.push('')">
            <lf-icon name="add-line" />
            Add another email
          </lf-button>
        </article>

        <article>
          <lf-field label-text="Identities">
            <div class="flex flex-col gap-3">
              <div v-for="(identity) of form.identities" :key="identity.platform">
                <lf-input v-model="identity.value" :placeholder="`${identity.placeholder || ''}...`" class="h-10">
                  <template #prefix>
                    <div class="flex items-center flex-nowrap whitespace-nowrap">
                      <div class="min-w-5">
                        <lf-tooltip :content="identity.platform">
                          <img :src="identity.image" class="h-5 w-5" :alt="identity.platform" />
                        </lf-tooltip>
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
      </div>
    </section>

    <section class="border-t border-gray-100 py-4 px-6 gap-4 flex justify-end  z-40">
      <lf-button type="secondary-ghost" @click="isModalOpen = false">
        Cancel
      </lf-button>
      <lf-button type="primary" :disabled="$v.$invalid">
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
import LfTooltip from '@/ui-kit/tooltip/Tooltip.vue';
import useVuelidate from '@vuelidate/core';
import { required } from '@vuelidate/validators';
import LfFieldMessages from '@/ui-kit/field-messages/FieldMessages.vue';
import LfContributorAddEmailItem from '@/modules/contributor/components/edit/add/contributor-add-email-item.vue';

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
  placeholder: string,
}

const platformList: ContributorAddIdentity[] = Object.entries(CrowdIntegrations.memberIdentities)
  .map(([key, config]) => ({
    prefix: config.urlPrefix,
    placeholder: config.placeholder,
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

const rules = {
  subproject: {
    required,
  },
  name: {
    required,
  },
  email: {
    required: (value: ContributorAddIdentity[]) => value.some((i) => i.length),
  },
  identities: {
    required: (value: ContributorAddIdentity[]) => value.some((i) => i.value.length),
  },
};

const $v = useVuelidate(rules, form);
</script>

<script lang="ts">
export default {
  name: 'LfContributorAdd',
};
</script>

<style lang="scss" scoped>
.contributor-form{
  box-shadow: inset 0px -4px 8px 0px #0000000D;
}
</style>

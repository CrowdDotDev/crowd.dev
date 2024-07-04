<template>
  <lf-modal v-model="isModalOpen">
    <template #default="{ close }">
      <div class="px-6 pt-4 pb-10">
        <div class="flex items-center justify-between pb-6">
          <h5>Add identity</h5>
          <lf-button type="secondary-ghost-light" :icon-only="true" @click="close">
            <lf-icon name="close-line" />
          </lf-button>
        </div>

        <div class="flex flex-col gap-3 items-start">
          <article v-for="(identity, ii) of form" :key="ii" class="flex items-center w-full">
            <lf-input v-model="identity.value" class="!rounded-r-none h-10 flex-grow">
              <template #prefix>
                <div class="flex items-center flex-nowrap whitespace-nowrap">
                  <div class="min-w-5">
                    <lf-icon v-if="identity.type === 'email'" name="mail-line" class="text-black" :size="20" />
                    <img
                      v-else-if="platform(identity.platform)"
                      :src="platform(identity.platform)?.image"
                      class="h-5 w-5 object-contain"
                      :alt="identity.value"
                    />
                    <lf-icon
                      v-else
                      name="fingerprint-fill"
                      :size="20"
                      class="text-gray-600"
                    />
                  </div>
                  <p v-if="identity.type !== 'email' && platform(identity.platform)?.urlPrefix" class="-mr-2 text-black pl-2">
                    {{ platform(identity.platform)?.urlPrefix }}
                  </p>
                </div>
              </template>
            </lf-input>
            <label class="border border-gray-200 h-10 py-2.5 px-3 border-l-0 cursor-pointer rounded-r-lg">
              <lf-checkbox v-model="identity.verified">
                Verified
              </lf-checkbox>
            </label>
          </article>
          <lf-contributor-details-identity-add-dropdown
            placement="bottom-end"
            @add="form.push({
              ...defaultForm,
              ...$event,
            })"
          >
            <lf-button type="primary-link" size="small">
              <lf-icon name="add-line" />
              Add identity
            </lf-button>
          </lf-contributor-details-identity-add-dropdown>
        </div>
      </div>
      <div class="py-4 px-6 border-t border-gray-100 flex items-center justify-end gap-4">
        <lf-button type="secondary-ghost" @click="close">
          Cancel
        </lf-button>
        <lf-button
          type="primary"
          :disabled="$v.$invalid"
          @click="addIdentities()"
        >
          Add {{ pluralize('identity', form.length) }}
        </lf-button>
      </div>
    </template>
  </lf-modal>
</template>

<script setup lang="ts">
import LfModal from '@/ui-kit/modal/Modal.vue';
import { computed, reactive } from 'vue';
import { Contributor, ContributorIdentity } from '@/modules/contributor/types/Contributor';
import LfButton from '@/ui-kit/button/Button.vue';
import LfIcon from '@/ui-kit/icon/Icon.vue';
import LfInput from '@/ui-kit/input/Input.vue';
import { CrowdIntegrations } from '@/integrations/integrations-config';
import LfCheckbox from '@/ui-kit/checkbox/Checkbox.vue';
import { useContributorStore } from '@/modules/contributor/store/contributor.store';
import Message from '@/shared/message/message';
import LfContributorDetailsIdentityAddDropdown
  from '@/modules/contributor/components/details/identity/contributor-details-identity-add-dropdown.vue';
import pluralize from 'pluralize';
import { helpers, required } from '@vuelidate/validators';
import useVuelidate from '@vuelidate/core';

const props = defineProps<{
  modelValue: boolean,
  identities: Partial<ContributorIdentity>[],
  contributor: Contributor,
}>();

const emit = defineEmits<{(e: 'update:modelValue', value: boolean): void}>();

const { updateContributor } = useContributorStore();

const defaultForm: ContributorIdentity = {
  value: '',
  verified: true,
  platform: 'custom',
  type: 'username',
  sourceId: null,
};

const form = reactive<ContributorIdentity[]>(props.identities.map((i) => ({ ...defaultForm, ...i })));

const rules = {
  form: {
    $each: helpers.forEach({
      value: {
        required,
      },
    }),
  },
};

const $v = useVuelidate(rules, { form });

const isModalOpen = computed<boolean>({
  get() {
    return props.modelValue;
  },
  set(value: boolean) {
    emit('update:modelValue', value);
  },
});

const platform = (platform: string) => CrowdIntegrations.getConfig(platform);

const addIdentities = () => {
  updateContributor(props.contributor.id, {
    identities: [
      ...props.contributor.identities,
      ...form,
    ],
  })
    .then(() => {
      Message.success('Identities successfully added');
      isModalOpen.value = false;
    });
};
</script>

<script lang="ts">
export default {
  name: 'LfContributorDetailsIdentityAdd',
};
</script>

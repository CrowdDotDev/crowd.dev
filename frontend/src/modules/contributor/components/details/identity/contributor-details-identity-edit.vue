<template>
  <lf-modal v-model="isModalOpen">
    <template #default="{ close }">
      <div class="px-6 pt-4 pb-10">
        <div class="flex items-center justify-between pb-6">
          <h5>Update identity</h5>
          <lf-button type="secondary-ghost-light" :icon-only="true" @click="close">
            <lf-icon name="close-line" />
          </lf-button>
        </div>

        <div class="flex items-center">
          <lf-input v-model="form.value" class="!rounded-r-none h-10 flex-grow" placeholder="...">
            <template #prefix>
              <div class="flex items-center flex-nowrap whitespace-nowrap">
                <div class="min-w-5">
                  <lf-icon v-if="form.type === 'email'" name="mail-line" class="text-black" :size="20" />
                  <img
                    v-else-if="platform"
                    :src="platform?.image"
                    class="h-5 w-5 object-contain"
                    :alt="form.value"
                  />
                  <lf-icon
                    v-else
                    name="fingerprint-fill"
                    :size="20"
                    class="text-gray-600"
                  />
                </div>
                <p
                  v-if="form.type !== 'email' && platform?.urlPrefix"
                  class="-mr-2 pl-2"
                  :class="form.value?.length ? 'text-black' : 'text-gray-400'"
                >
                  {{ platform?.urlPrefix }}
                </p>
              </div>
            </template>
          </lf-input>
          <label class="border border-gray-200 h-10 py-2.5 px-3 border-l-0 cursor-pointer rounded-r-lg">
            <lf-checkbox v-model="form.verified">
              Verified
            </lf-checkbox>
          </label>
        </div>
      </div>
      <div class="py-4 px-6 border-t border-gray-100 flex items-center justify-end gap-4">
        <lf-button type="secondary-ghost" @click="close">
          Cancel
        </lf-button>
        <lf-button
          type="primary"
          :disabled="$v.$invalid || !hasFormChanged"
          @click="updateIdentity()"
        >
          Update identity
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
import { email, required } from '@vuelidate/validators';
import useVuelidate from '@vuelidate/core';

const props = defineProps<{
  modelValue: ContributorIdentity | null,
  contributor: Contributor,
}>();

const emit = defineEmits<{(e: 'update:modelValue', value: ContributorIdentity | null): void}>();

const { updateContributor } = useContributorStore();

const defaultForm: ContributorIdentity = {
  value: '',
  verified: true,
  platform: 'custom',
  type: 'username',
  sourceId: null,
};

const form = reactive<ContributorIdentity>({
  ...defaultForm,
  ...props.modelValue,
});

const rules = {
  form: {
    value: {
      required,
      email: props.modelValue?.type === 'email' ? email : undefined,
    },
  },
};

const $v = useVuelidate(rules, { form });

const hasFormChanged = computed(() => form.value !== props.modelValue?.value || form.verified !== props.modelValue?.verified);

const isModalOpen = computed<boolean>({
  get() {
    return props.modelValue !== null;
  },
  set(value: boolean) {
    emit('update:modelValue', value ? props.modelValue : null);
  },
});

const platform = computed(() => CrowdIntegrations.getConfig(form.platform));

const updateIdentity = () => {
  const identities = props.contributor.identities.map((i: ContributorIdentity) => {
    if (i.platform === props.modelValue?.platform && i.value === props.modelValue?.value) {
      return form as ContributorIdentity;
    }
    return i;
  });

  updateContributor(props.contributor.id, {
    identities,
  })
    .then(() => {
      Message.success('Identity updated successfully');
      isModalOpen.value = false;
    });
};
</script>

<script lang="ts">
export default {
  name: 'LfContributorDetailsIdentityEdit',
};
</script>

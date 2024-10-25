<template>
  <lf-modal v-model="isModalOpen" class="!overflow-visible">
    <template #default="{ close }">
      <div class="px-6 pt-4 pb-10">
        <div class="flex items-center justify-between pb-6">
          <h5>Add identity</h5>
          <lf-button type="secondary-ghost-light" :icon-only="true" @click="close">
            <lf-icon-old name="close-line" />
          </lf-button>
        </div>

        <div class="flex flex-col gap-3 items-start">
          <article v-for="(identity, ii) of form" :key="ii" class="w-full">
            <lf-field class="w-full">
              <div class="flex items-center w-full">
                <lf-input
                  v-model="identity.value"
                  class="h-10 flex-grow"
                  placeholder="..."
                  :invalid="$v.form[ii].value.$invalid && $v.form[ii].value.$dirty"
                  @blur="$v.form[ii].value.$touch()"
                >
                  <template #prefix>
                    <div class="flex items-center flex-nowrap whitespace-nowrap">
                      <div class="min-w-5">
                        <img
                          v-if="platform(identity.platform)"
                          :src="platform(identity.platform)?.image"
                          class="h-5 w-5 object-contain"
                          :alt="identity.value"
                        />
                        <lf-icon-old
                          v-else
                          name="fingerprint-fill"
                          :size="20"
                          class="text-gray-600"
                        />
                      </div>
                      <p
                        v-if="platform(identity.platform)?.orgUrlPrefix || platform(identity.platform)?.urlPrefix"
                        class="-mr-2 pl-2"
                        :class="identity.value?.length ? 'text-black' : 'text-gray-400'"
                      >
                        {{ platform(identity.platform)?.orgUrlPrefix || platform(identity.platform)?.urlPrefix }}
                      </p>
                    </div>
                  </template>
                </lf-input>
                <lf-button
                  v-if="form.length > 1"
                  class="ml-3"
                  type="secondary-ghost-light"
                  :icon-only="true"
                  @click="form.splice(ii, 1)"
                >
                  <lf-icon-old name="delete-bin-6-line" />
                </lf-button>
              </div>
              <lf-field-messages
                :validation="$v.form[ii].value"
                :error-messages="{
                  required: 'This field is required',
                  email: 'This email address is not valid',
                }"
              />
            </lf-field>
          </article>
          <lf-organization-details-identity-add-dropdown
            placement="bottom-start"
            @add="form.push({
              ...defaultForm,
              ...$event,
            })"
          >
            <lf-button type="primary-link" size="small">
              <lf-icon-old name="add-line" />
              Add identity
            </lf-button>
          </lf-organization-details-identity-add-dropdown>
        </div>
      </div>
      <div class="py-4 px-6 border-t border-gray-100 flex items-center justify-end gap-4">
        <lf-button type="secondary-ghost" @click="close">
          Cancel
        </lf-button>
        <lf-button
          type="primary"
          :loading="sending"
          :disabled="$v.$invalid || sending"
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
import { computed, reactive, ref } from 'vue';
import LfButton from '@/ui-kit/button/Button.vue';
import LfIconOld from '@/ui-kit/icon/IconOld.vue';
import LfInput from '@/ui-kit/input/Input.vue';
import { CrowdIntegrations } from '@/integrations/integrations-config';
import Message from '@/shared/message/message';
import pluralize from 'pluralize';
import useVuelidate from '@vuelidate/core';
import LfField from '@/ui-kit/field/Field.vue';
import LfFieldMessages from '@/ui-kit/field-messages/FieldMessages.vue';
import {
  Organization,
  OrganizationIdentity,
  OrganizationIdentityType,
} from '@/modules/organization/types/Organization';
import { useOrganizationStore } from '@/modules/organization/store/pinia';
import { Platform } from '@/shared/modules/platform/types/Platform';
import LfOrganizationDetailsIdentityAddDropdown
  from '@/modules/organization/components/details/identity/organization-details-identity-add-dropdown.vue';
import { required } from '@vuelidate/validators';

const props = defineProps<{
  modelValue: boolean,
  identities: Partial<OrganizationIdentity>[],
  organization: Organization,
}>();

const emit = defineEmits<{(e: 'update:modelValue', value: boolean): void}>();

const { updateOrganization } = useOrganizationStore();

const sending = ref<boolean>(false);

const defaultForm: OrganizationIdentity = {
  value: '',
  verified: false,
  platform: Platform.CUSTOM,
  type: OrganizationIdentityType.USERNAME,
  sourceId: null,
};

const form = reactive<OrganizationIdentity[]>(props.identities.map((i) => ({ ...defaultForm, ...i })));

const rules = computed(() => ({
  form: form.map((item) => ({
    value: {
      required,
    },
  })),
}));

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
  sending.value = true;
  updateOrganization(props.organization.id, {
    identities: [
      ...props.organization.identities,
      ...form.map((i) => ({
        ...i,
        value: i.platform === Platform.LINKEDIN ? `company:${i.value}` : i.value,
      })),
    ],
  })
    .then(() => {
      Message.success('Identities successfully added');
      isModalOpen.value = false;
    })
    .catch(() => {
      Message.error('Something went wrong while adding a new identity');
    })
    .finally(() => {
      sending.value = false;
    });
};
</script>

<script lang="ts">
export default {
  name: 'LfOrganizationIdentityAdd',
};
</script>

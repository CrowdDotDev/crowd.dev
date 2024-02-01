<template>
  <app-page-wrapper
    :container-class="'col-start-1 col-span-12'"
  >
    <div class="organization-form-page">
      <div class="sticky -top-5 z-20 bg-gray-50 -mx-2 px-2 -mt-6 pt-6 block">
        <div class="border-b border-gray-200">
          <el-button
            key="organizations"
            link
            :icon="ArrowPrevIcon"
            class="text-gray-600 btn-link--md btn-link--secondary p-0"
            @click="onCancel"
          >
            Organizations
          </el-button>
          <div class="flex justify-between">
            <div>
              <h4 class="mt-4 mb-6">
                {{
                  isEditPage
                    ? 'Edit organization'
                    : 'New organization'
                }}
              </h4>
            </div>
            <div class="flex items-center">
              <el-button
                v-if="isEditPage && hasFormChanged"
                class="btn btn-link btn-link--primary"
                :disabled="isFormSubmitting"
                @click="onReset"
              >
                <i class="ri-arrow-go-back-line" />
                <span>Reset changes</span>
              </el-button>
              <div
                v-if="isEditPage && hasFormChanged"
                class="mx-4 border-x border-gray-200 h-10"
              />
              <div class="flex gap-4">
                <el-button
                  :disabled="isFormSubmitting"
                  class="btn btn--md btn--bordered"
                  @click="onCancel"
                >
                  Cancel
                </el-button>
                <el-button
                  :disabled="isSubmitBtnDisabled"
                  :loading="isFormSubmitting"
                  :loading-icon="LoaderIcon"
                  class="btn btn--md btn--primary"
                  @click="onSubmit"
                >
                  {{
                    isEditPage
                      ? 'Update organization'
                      : 'Add organization'
                  }}
                </el-button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <el-container
        v-if="!isPageLoading"
        class="bg-white rounded-b-lg shadow shadow-black/15"
      >
        <el-main class="p-6">
          <el-form
            ref="formRef"
            class="form flex-col"
            label-position="top"
            :rules="rules"
            :model="formModel"
          >
            <app-organization-form-details
              v-model="formModel"
              :fields="fields"
            />
            <el-divider
              class="!mb-6 !mt-8 !border-gray-200"
            />
            <div class="grid gap-x-12 grid-cols-3">
              <h6>Identities</h6>
              <div class="col-span-2">
                <app-organization-form-identities
                  v-model="formModel"
                  :record="record"
                />
              </div>
            </div>
            <el-divider
              class="!mb-6 !mt-8 !border-gray-200"
            />
            <div class="grid gap-x-12 grid-cols-3">
              <h6>Emails</h6>
              <div class="col-span-2">
                <app-organization-form-emails
                  v-model="formModel"
                />
              </div>
            </div>
            <el-divider
              class="!mb-6 !mt-8 !border-gray-200"
            />
            <div class="grid gap-x-12 grid-cols-3">
              <h6>Phone numbers</h6>
              <div class="col-span-2">
                <app-organization-form-phone-number
                  v-model="formModel"
                />
              </div>
            </div>
            <div v-if="shouldShowAttributes">
              <el-divider
                class="!mb-6 !mt-8 !border-gray-200"
              />
              <app-organization-form-attributes
                v-model="formModel"
                :organization="record"
              />
            </div>
          </el-form>
        </el-main>
      </el-container>
      <el-container v-else>
        <div
          v-loading="isPageLoading"
          class="app-page-spinner w-full"
        />
      </el-container>
    </div>
  </app-page-wrapper>
</template>

<script setup>
import {
  computed,
  h,
  onMounted,
  onUnmounted,
  reactive,
  ref,
  watch,
} from 'vue';
import {
  onBeforeRouteLeave,
  useRoute,
  useRouter,
} from 'vue-router';
import isEqual from 'lodash/isEqual';
import { OrganizationModel } from '@/modules/organization/organization-model';
import { FormSchema } from '@/shared/form/form-schema';
import ConfirmDialog from '@/shared/dialog/confirm-dialog';
import AppOrganizationFormIdentities from '@/modules/organization/components/form/organization-form-identities.vue';
import AppOrganizationFormDetails from '@/modules/organization/components/form/organization-form-details.vue';
import AppOrganizationFormAttributes from '@/modules/organization/components/form/organization-form-attributes.vue';
import enrichmentAttributes from '@/modules/organization/config/enrichment';
import { OrganizationService } from '@/modules/organization/organization-service';
import Errors from '@/shared/error/errors';
import Message from '@/shared/message/message';
import { i18n } from '@/i18n';
import { AttributeType } from '@/modules/organization/types/Attributes';
import AppOrganizationFormEmails from '@/modules/organization/components/form/organization-form-emails.vue';
import AppOrganizationFormPhoneNumber from '@/modules/organization/components/form/organization-form-phone-number.vue';

const LoaderIcon = h(
  'i',
  {
    class: 'ri-loader-4-fill text-sm text-white',
  },
  [],
);
const ArrowPrevIcon = h(
  'i', // type
  {
    class: 'ri-arrow-left-s-line text-base leading-none',
  }, // props
  [],
);

const props = defineProps({
  id: {
    type: String,
    default: null,
  },
});

const { fields } = OrganizationModel;
const formSchema = new FormSchema([
  fields.name,
  fields.displayName,
  fields.headline,
  fields.description,
  fields.website,
  fields.location,
  fields.employees,
  fields.revenueRange,
  fields.github,
  fields.twitter,
  fields.linkedin,
  fields.crunchbase,
  fields.emails,
  fields.identities,
  fields.phoneNumbers,
  fields.type,
  fields.size,
  fields.industry,
  fields.founded,
  fields.profiles,
  fields.affiliatedProfiles,
  fields.allSubsidiaries,
  fields.alternativeDomains,
  fields.alternativeNames,
  fields.averageEmployeeTenure,
  fields.averageTenureByLevel,
  fields.averageTenureByRole,
  fields.directSubsidiaries,
  fields.employeeChurnRate,
  fields.employeeCountByCountry,
  fields.employeeCountByMonth,
  fields.employeeGrowthRate,
  fields.gicsSector,
  fields.grossAdditionsByMonth,
  fields.grossDeparturesByMonth,
  fields.immediateParent,
  fields.tags,
  fields.ultimateParent,
]);

const router = useRouter();
const route = useRoute();

function getInitialModel(record) {
  return JSON.parse(
    JSON.stringify(
      formSchema.initialValues({
        ...(record || {}),
        name: record ? record.name : '',
        displayName: record ? record.displayName || record.name : '',
        headline: record ? record.headline : '',
        description: record ? record.description : '',
        joinedAt: record ? record.joinedAt : '',
        identities: record ? [...record.identities.map((i) => ({
          ...i,
          platform: i.platform,
          name: i.name,
          username: i.url ? i.url.split('/').at(-1) : null,
          url: i.url,
        }))] : [],
        revenueRange: record ? record.revenueRange : {},
        emails:
          record && record.emails?.length > 0
            ? record.emails
            : [''],
        phoneNumbers:
          record && record.phoneNumbers?.length > 0
            ? record.phoneNumbers
            : [''],
      }),
    ),
  );
}

const record = ref(null);
const formRef = ref(null);
const formModel = ref(getInitialModel());

const isPageLoading = ref(true);
const isFormSubmitting = ref(false);
const wasFormSubmittedSuccessfuly = ref(false);

const rules = reactive(formSchema.rules());

// UI Validations
const isEditPage = computed(() => !!route.params.id);
const isFormValid = computed(() => formSchema.isValidSync(formModel.value));

const hasFormChanged = computed(() => {
  const initialModel = isEditPage.value
    ? getInitialModel(record.value)
    : getInitialModel();

  return !isEqual(initialModel, formModel.value);
});

const isSubmitBtnDisabled = computed(
  () => !isFormValid.value
    || isFormSubmitting.value
    || (isEditPage.value && !hasFormChanged.value),
);

const shouldShowAttributes = computed(() => enrichmentAttributes.some((a) => {
  if (!a.showInForm) {
    return false;
  }

  if (a.type === AttributeType.ARRAY) {
    return !!record.value?.[a.name]?.length;
  }

  return !!record.value?.[a.name];
}));

// Prevent lost data on route change
onBeforeRouteLeave((to) => {
  if (
    hasFormChanged.value
    && !wasFormSubmittedSuccessfuly.value
    && to.fullPath !== '/500'
  ) {
    return ConfirmDialog({})
      .then(() => true)
      .catch(() => false);
  }

  return true;
});

onMounted(async () => {
  if (isEditPage.value) {
    const { id } = route.params;

    try {
      record.value = await OrganizationService.find(id);
    } catch (e) {
      Errors.handle(error);
      router.push({ name: 'organization' });
    }

    isPageLoading.value = false;
    formModel.value = getInitialModel(record.value);
  } else {
    isPageLoading.value = false;
  }
});

// Prevent window reload when form has changes
const preventWindowReload = (e) => {
  if (hasFormChanged.value) {
    e.preventDefault();
    e.returnValue = '';
  }
};

window.addEventListener('beforeunload', preventWindowReload);

onUnmounted(() => {
  window.removeEventListener(
    'beforeunload',
    preventWindowReload,
  );
});

// Once form is submitted successfuly, update route
watch(
  wasFormSubmittedSuccessfuly,
  (isFormSubmittedSuccessfuly) => {
    if (isFormSubmittedSuccessfuly) {
      if (isEditPage.value) {
        return router.push({
          name: 'organizationView',
          params: {
            id: record.value.id,
          },
        });
      }

      return router.push({ name: 'organization' });
    }
    return null;
  },
);

function onReset() {
  formModel.value = isEditPage.value
    ? getInitialModel(record.value)
    : getInitialModel();
}

function onCancel() {
  router.push({ name: 'organization' });
}

async function onSubmit() {
  isFormSubmitting.value = true;

  const data = {
    manuallyCreated: true,
    ...formModel.value,
    name: isEditPage.value === false ? formModel.value.displayName : undefined,
    displayName: isEditPage.value === true ? formModel.value.displayName : undefined,
    emails: formModel.value.emails.reduce((acc, item) => {
      if (item !== '') {
        acc.push(item);
      }
      return acc;
    }, []),
    identities: formModel.value.identities
      .map((i) => ({
        ...i,
        platform: i.platform,
        url: i.url,
        name: i.name,
      })),
    phoneNumbers: formModel.value.phoneNumbers.reduce(
      (acc, item) => {
        if (item !== '') {
          acc.push(item);
        }
        return acc;
      },
      [],
    ),
  };

  const payload = isEditPage.value
    ? { id: props.id, values: data }
    : data;

  // Edit
  if (isEditPage.value) {
    try {
      await OrganizationService.update(
        payload.id,
        payload.values,
      );
      Message.success(i18n('entities.organization.update.success'));
    } catch (error) {
      Errors.handle(error);
    }
  } else {
    // Create
    try {
      await OrganizationService.create(payload);

      Message.success(i18n('entities.organization.create.success'));
    } catch (error) {
      Message.error(i18n('entities.organization.create.error'));
      Errors.handle(error);
    }
  }
  isFormSubmitting.value = false;
  wasFormSubmittedSuccessfuly.value = true;
}
</script>

<script>
export default {
  name: 'OrganizationFormPage',
};
</script>

<style lang="scss">
.organization-form-page {
  .el-button [class*='el-icon'] + span {
    @apply ml-1;
  }

  .el-main {
    @apply max-h-fit;
  }

  // Personal Details form
  .organization-details-form {
    & .el-form-item {
      @apply mb-6;
    }
  }

  .identities-form .el-form-item,
  .custom-attributes-form .el-form-item {
    @apply mb-0;
  }

  .el-form .el-form-item__content,
  .el-form--default.el-form--label-top,
  .custom-attributes-form,
  .el-form-item__content {
    @apply flex mb-0;
  }
}
</style>

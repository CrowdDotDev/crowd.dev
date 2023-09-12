<template>
  <app-page-wrapper
    :container-class="'col-start-1 col-span-12'"
  >
    <div class="organization-form-page">
      <el-button
        key="organizations"
        link
        :icon="ArrowPrevIcon"
        class="text-gray-600 btn-link--md btn-link--secondary p-0"
        @click="onCancel"
      >
        Organizations
      </el-button>
      <h4 class="mt-4 mb-6">
        {{
          isEditPage
            ? 'Edit organization'
            : 'New organization'
        }}
      </h4>
      <el-container
        v-if="!isPageLoading"
        class="bg-white rounded-lg shadow shadow-black/15"
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
            <app-organization-form-identities
              v-model="formModel"
              :record="record"
            />
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
        <el-footer
          class="bg-gray-50 flex items-center p-6 h-fit rounded-b-lg"
          :class="
            isEditPage && hasFormChanged
              ? 'justify-between'
              : 'justify-end'
          "
        >
          <el-button
            v-if="isEditPage && hasFormChanged"
            class="btn btn-link btn-link--primary"
            :disabled="isFormSubmitting"
            @click="onReset"
          >
            <i class="ri-arrow-go-back-line" />
            <span>Reset changes</span>
          </el-button>
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
        </el-footer>
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
import { attributesTypes } from '@/modules/organization/types/Attributes';

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
        name: record ? record.name : '',
        displayName: record ? record.displayName || record.name : '',
        headline: record ? record.headline : '',
        description: record ? record.description : '',
        joinedAt: record ? record.joinedAt : '',
        employees: record ? record.employees : null,
        location: record ? record.location : null,
        website: record ? record.website : null,
        identities: record ? [...record.identities.map((i) => ({
          platform: i.platform,
          name: i.name,
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
        type: record ? record.type : null,
        size: record ? record.size : null,
        industry: record ? record.industry : null,
        founded: record ? record.founded : null,
        profiles: record ? record.profiles : null,
        affiliatedProfiles: record ? record.affiliatedProfiles : null,
        allSubsidiaries: record ? record.allSubsidiaries : null,
        alternativeDomains: record ? record.alternativeDomains : null,
        alternativeNames: record ? record.alternativeNames : null,
        averageEmployeeTenure: record ? record.averageEmployeeTenure : null,
        averageTenureByLevel: record ? record.averageTenureByLevel : null,
        averageTenureByRole: record ? record.averageTenureByRole : null,
        directSubsidiaries: record ? record.directSubsidiaries : null,
        employeeChurnRate: record ? record.employeeChurnRate : null,
        employeeCountByCountry: record ? record.employeeCountByCountry : null,
        employeeCountByMonth: record ? record.employeeCountByMonth : null,
        employeeGrowthRate: record ? record.employeeGrowthRate : null,
        gicsSector: record ? record.gicsSector : null,
        grossAdditionsByMonth: record ? record.grossAdditionsByMonth : null,
        grossDeparturesByMonth: record ? record.grossDeparturesByMonth : null,
        immediateParent: record ? record.immediateParent : null,
        tags: record ? record.tags : null,
        ultimateParent: record ? record.ultimateParent : null,
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

  if (a.type === attributesTypes.array) {
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
      Message.error(i18n('entities.organization.update.error'));

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

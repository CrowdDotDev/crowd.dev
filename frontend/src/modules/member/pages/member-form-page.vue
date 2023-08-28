<template>
  <app-page-wrapper
    :container-class="'col-start-1 col-span-12'"
  >
    <div class="member-form-page">
      <el-button
        key="members"
        link
        :icon="ArrowPrevIcon"
        class="text-gray-600 btn-link--md btn-link--secondary p-0"
        @click="onCancel"
      >
        Members
      </el-button>
      <h4 class="mt-4 mb-6">
        {{ isEditPage ? 'Edit member' : 'New member' }}
      </h4>
      <el-container
        v-if="!isPageLoading"
        class="bg-white rounded-lg shadow shadow-black/15"
      >
        <el-main class="p-6">
          <el-form
            ref="formRef"
            class="form"
            label-position="top"
            :rules="rules"
            :model="formModel"
          >
            <app-member-form-details
              v-model="formModel"
              :fields-value="computedFields"
            />
            <el-divider
              class="!mb-6 !mt-8 !border-gray-200"
            />
            <app-member-form-identities
              v-model="formModel"
              :record="record"
            />
            <el-divider
              class="!mb-6 !mt-16 !border-gray-200"
            />
            <app-member-form-organizations
              v-model="formModel"
            />
            <el-divider
              class="!mb-6 !mt-16 !border-gray-200"
            />
            <app-member-form-attributes
              v-model="formModel"
              :attributes="computedAttributes"
              :record="record"
              @open-drawer="() => (isDrawerOpen = true)"
            />
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
                isEditPage ? 'Update member' : 'Add member'
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

    <!-- Manage Custom Attributes Drawer-->
    <app-member-global-attributes-drawer
      v-if="computedAttributes.length"
      v-model="isDrawerOpen"
    />
  </app-page-wrapper>
</template>

<script setup>
import {
  computed, h, onMounted, onUnmounted, reactive, ref, watch,
} from 'vue';
import { onBeforeRouteLeave, useRoute, useRouter } from 'vue-router';
import isEqual from 'lodash/isEqual';
import { useStore } from 'vuex';
import { storeToRefs } from 'pinia';
import AppMemberFormDetails from '@/modules/member/components/form/member-form-details.vue';
import AppMemberFormIdentities from '@/modules/member/components/form/member-form-identities.vue';
import AppMemberFormAttributes from '@/modules/member/components/form/member-form-attributes.vue';
import AppMemberGlobalAttributesDrawer from '@/modules/member/components/member-global-attributes-drawer.vue';
import AppMemberFormOrganizations from '@/modules/member/components/form/member-form-organizations.vue';
import { MemberModel } from '@/modules/member/member-model';
import { FormSchema } from '@/shared/form/form-schema';
import ConfirmDialog from '@/shared/dialog/confirm-dialog';
import getCustomAttributes from '@/shared/fields/get-custom-attributes';
import getAttributesModel from '@/shared/attributes/get-attributes-model';
import getParsedAttributes from '@/shared/attributes/get-parsed-attributes';
import { useMemberStore } from '@/modules/member/store/pinia';

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

const { getMemberCustomAttributes } = useMemberStore();
const router = useRouter();
const route = useRoute();
const store = useStore();

const memberStore = useMemberStore();
const { customAttributes } = storeToRefs(memberStore);

const { fields } = MemberModel;
const formSchema = computed(
  () => new FormSchema([
    fields.displayName,
    fields.name,
    fields.emails,
    fields.joinedAt,
    fields.tags,
    fields.username,
    fields.organizations,
    fields.attributes,
    ...getCustomAttributes({
      customAttributes: customAttributes.value,
      considerShowProperty: false,
    }),
  ]),
);

function filteredAttributes(attributes) {
  return Object.keys(attributes).reduce((acc, item) => {
    if (
      ![
        'emails',
        'workExperiences',
        'education',
        'certifications',
        'awards',
      ].includes(item)
    ) {
      acc[item] = attributes[item];
    }
    return acc;
  }, {});
}

function getInitialModel(r) {
  const attributes = getAttributesModel(r);

  return JSON.parse(
    JSON.stringify(
      formSchema.value.initialValues({
        displayName: r ? r.displayName : '',
        name: r ? r.name : '',
        emails: r ? r.emails?.filter((e) => !!e) || [] : [],
        joinedAt: r ? r.joinedAt : '',
        attributes: r
          ? filteredAttributes(r.attributes)
          : {},
        organizations: r ? r.organizations.map((o) => ({
          ...o,
          displayName: o.displayName || o.name,
          label: o.displayName || o.name,
        })) : [],
        ...attributes,
        tags: r ? r.tags : [],
        username: r ? r.username : {},
        platform: r
          ? r.username[Object.keys(r.username)[0]]
          : '',
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
const isDrawerOpen = ref(false);

const rules = reactive(formSchema.value.rules());

const computedFields = computed(() => fields);
const computedAttributes = computed(() => Object.values(customAttributes.value));

// UI Validations
const isEditPage = computed(() => !!route.params.id);
const isFormValid = computed(() => formSchema.value.isValidSync(formModel.value));

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
  // Fetch custom attributes on mount
  await getMemberCustomAttributes();

  if (isEditPage.value) {
    const { id } = route.params;

    record.value = await store.dispatch('member/doFind', id);
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
          name: 'memberView',
          params: {
            id: record.value.id,
          },
        });
      }

      return router.push({ name: 'member' });
    }
    return null;
  },
);

async function onReset() {
  formModel.value = isEditPage.value
    ? getInitialModel(record.value)
    : getInitialModel();
}

async function onCancel() {
  router.push({ name: 'member' });
}

async function onSubmit() {
  const formattedAttributes = getParsedAttributes(
    computedAttributes.value,
    formModel.value,
  );

  // Remove any existent empty data
  const data = {

    ...formModel.value.displayName && {
      displayName: formModel.value.displayName,
    },
    ...formModel.value.emails && {
      emails: formModel.value.emails,
    },
    ...formModel.value.joinedAt && {
      joinedAt: formModel.value.joinedAt,
    },
    ...formModel.value.platform && {
      platform: formModel.value.platform,
    },
    ...formModel.value.tags.length && {
      tags: formModel.value.tags.map((t) => t.id),
    },
    ...formModel.value.organizations.length && {
      organizations: formModel.value.organizations.map(
        (o) => ({
          id: o.id,
          name: o.name,
          ...o.memberOrganizations?.title && {
            title: o.memberOrganizations?.title,
          },
          ...o.memberOrganizations?.dateStart && {
            startDate: o.memberOrganizations?.dateStart,
          },
          ...o.memberOrganizations?.dateEnd && {
            endDate: o.memberOrganizations?.dateEnd,
          },
        }),
      ).filter(
        (o) => !!o.id,
      ),
    },
    ...(Object.keys(formattedAttributes).length
      || formModel.value.attributes) && {
      attributes: {
        ...(Object.keys(formattedAttributes).length
          && formattedAttributes),
        ...(formModel.value.attributes.url && {
          url: formModel.value.attributes.url,
        }),
      },
    },
    ...Object.keys(formModel.value.username).length && {
      username: formModel.value.username,
    },

    manuallyCreated: true,
  };

  let isRequestSuccessful = false;

  // Edit member
  if (isEditPage.value) {
    isFormSubmitting.value = true;

    isRequestSuccessful = await store.dispatch(
      'member/doUpdate',
      {
        id: record.value.id,
        values: data,
      },
    );
  } else {
    // Create new member
    isFormSubmitting.value = true;
    isRequestSuccessful = await store.dispatch(
      'member/doCreate',
      {
        data,
      },
    );
  }

  isFormSubmitting.value = false;

  if (isRequestSuccessful) {
    wasFormSubmittedSuccessfuly.value = true;
  }
}
</script>

<style lang="scss">
.member-form-page {
  .el-button [class*='el-icon'] + span {
    @apply ml-1;
  }

  .el-main {
    @apply max-h-fit;
  }

  // Personal Details form
  .personal-details-form {
    & .el-form-item {
      @apply mb-6;
    }

    & .app-tags-input {
      @apply w-full;
    }

    & .app-tags-input {
      & .el-input__wrapper {
        @apply gap-2 px-3;

        & .el-tag {
          @apply m-0 h-6 bg-gray-100 border-gray-200;
        }
      }
    }
  }

  .identities-form .el-form-item,
  .custom-attributes-form .el-form-item {
    @apply mb-0;
  }

  .el-form .el-form-item__content,
  .el-form--default.el-form--label-top
    .custom-attributes-form
    .el-form-item__content {
    @apply flex mb-0;
  }
}
</style>

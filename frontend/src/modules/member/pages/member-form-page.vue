<template>
  <app-page-wrapper
    :container-class="'md:col-start-1 md:col-span-6 lg:col-start-2 lg:col-span-10'"
  >
    <div class="member-form-page">
      <el-button
        key="members"
        link
        :icon="ArrowPrevIcon"
        class="text-gray-600 btn-link--md btn-link--secondary p-0"
        @click="onCancel"
        >Members</el-button
      >
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
            ><i class="ri-arrow-go-back-line"></i>
            <span>Reset changes</span></el-button
          >
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
        ></div>
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
import AppMemberFormDetails from '@/modules/member/components/form/member-form-details.vue'
import AppMemberFormIdentities from '@/modules/member/components/form/member-form-identities.vue'
import AppMemberFormAttributes from '@/modules/member/components/form/member-form-attributes.vue'
import AppMemberGlobalAttributesDrawer from '@/modules/member/components/member-global-attributes-drawer.vue'
import { MemberModel } from '@/modules/member/member-model'
import { FormSchema } from '@/shared/form/form-schema'
import {
  h,
  reactive,
  ref,
  computed,
  onMounted,
  onUnmounted,
  watch
} from 'vue'
import {
  useRouter,
  useRoute,
  onBeforeRouteLeave
} from 'vue-router'
import isEqual from 'lodash/isEqual'
import ConfirmDialog from '@/shared/confirm-dialog/confirm-dialog.js'
import { useStore } from 'vuex'
import getCustomAttributes from '@/shared/fields/get-custom-attributes.js'
import getAttributesModel from '@/shared/attributes/get-attributes-model.js'
import getParsedAttributes from '@/shared/attributes/get-parsed-attributes.js'
import { OrganizationService } from '@/modules/organization/organization-service'

const LoaderIcon = h(
  'i',
  {
    class: 'ri-loader-4-fill text-sm text-white'
  },
  []
)
const ArrowPrevIcon = h(
  'i', // type
  {
    class: 'ri-arrow-left-s-line text-base leading-none'
  }, // props
  []
)

const { fields } = MemberModel
const formSchema = computed(
  () =>
    new FormSchema([
      fields.displayName,
      fields.email,
      fields.joinedAt,
      fields.tags,
      fields.username,
      fields.organizations,
      fields.attributes,
      ...getCustomAttributes(
        store.state.member.customAttributes
      )
    ])
)

const router = useRouter()
const route = useRoute()
const store = useStore()

const record = ref(null)
const formRef = ref(null)
const formModel = ref(getInitialModel())

const isPageLoading = ref(true)
const isFormSubmitting = ref(false)
const wasFormSubmittedSuccessfuly = ref(false)
const isDrawerOpen = ref(false)

const rules = reactive(formSchema.value.rules())

const computedFields = computed(() => fields)
const computedAttributes = computed(() =>
  Object.values(store.state.member.customAttributes).filter(
    (attribute) => attribute.show
  )
)

// UI Validations
const isEditPage = computed(() => !!route.params.id)
const isFormValid = computed(() => {
  return formSchema.value.isValidSync(formModel.value)
})
const isSubmitBtnDisabled = computed(
  () =>
    !isFormValid.value ||
    isFormSubmitting.value ||
    (isEditPage.value && !hasFormChanged.value)
)
const hasFormChanged = computed(() => {
  const initialModel = isEditPage.value
    ? getInitialModel(record.value)
    : getInitialModel()

  return !isEqual(initialModel, formModel.value)
})

// Prevent lost data on route change
onBeforeRouteLeave((to) => {
  if (
    hasFormChanged.value &&
    !wasFormSubmittedSuccessfuly.value &&
    to.fullPath !== '/500'
  ) {
    return ConfirmDialog({})
      .then(() => {
        return true
      })
      .catch(() => {
        return false
      })
  }

  return true
})

onMounted(async () => {
  // Fetch custom attributes on mount
  await store.dispatch('member/doFetchCustomAttributes')

  if (isEditPage.value) {
    const id = route.params.id

    record.value = await store.dispatch('member/doFind', id)
    isPageLoading.value = false
    formModel.value = getInitialModel(record.value)
  } else {
    isPageLoading.value = false
  }
})

// Prevent window reload when form has changes
const preventWindowReload = (e) => {
  if (hasFormChanged.value) {
    e.preventDefault()
    e.returnValue = ''
  }
}

window.addEventListener('beforeunload', preventWindowReload)

onUnmounted(() => {
  window.removeEventListener(
    'beforeunload',
    preventWindowReload
  )
})

// Once form is submitted successfuly, update route
watch(
  wasFormSubmittedSuccessfuly,
  (isFormSubmittedSuccessfuly) => {
    if (isFormSubmittedSuccessfuly) {
      if (isEditPage.value) {
        return router.push({
          name: 'memberView',
          params: {
            id: record.value.id
          }
        })
      }

      return router.push({ name: 'member' })
    }
  }
)

function getInitialModel(record) {
  const attributes = getAttributesModel(record)

  return JSON.parse(
    JSON.stringify(
      formSchema.value.initialValues({
        displayName: record ? record.displayName : '',
        email: record ? record.email : '',
        joinedAt: record ? record.joinedAt : '',
        attributes: record ? record.attributes : {},
        organizations: record?.organizations.length
          ? record.organizations[0].name
          : '',
        ...attributes,
        tags: record ? record.tags : [],
        username: record ? record.username : {},
        platform: record
          ? record.username[Object.keys(record.username)[0]]
          : ''
      })
    )
  )
}

async function onReset() {
  const initialModel = isEditPage.value
    ? getInitialModel(record.value)
    : getInitialModel()

  formModel.value = initialModel
}

async function onCancel() {
  router.push({ name: 'member' })
}

async function onSubmit() {
  const formattedAttributes = getParsedAttributes(
    computedAttributes.value,
    formModel.value
  )

  // Remove any existent empty data
  const data = Object.assign(
    {},
    formModel.value.displayName && {
      displayName: formModel.value.displayName
    },
    formModel.value.email && {
      email: formModel.value.email
    },
    formModel.value.joinedAt && {
      joinedAt: formModel.value.joinedAt
    },
    formModel.value.platform && {
      platform: formModel.value.platform
    },
    formModel.value.tags.length && {
      tags: formModel.value.tags.map((t) => t.id)
    },
    (Object.keys(formattedAttributes).length ||
      formModel.value.attributes) && {
      attributes: {
        ...(Object.keys(formattedAttributes).length &&
          formattedAttributes),
        ...(formModel.value.attributes.url && {
          url: formModel.value.attributes.url
        })
      }
    },
    Object.keys(formModel.value.username).length && {
      username: formModel.value.username
    }
  )

  let isRequestSuccessful = false
  let organizations = [
    { name: formModel.value.organizations }
  ]

  // Edit member
  if (isEditPage.value) {
    isFormSubmitting.value = true

    // Create organization if it doesn't exist, before updating it on member
    if (formModel.value.organizations) {
      const response = await OrganizationService.create({
        name: formModel.value.organizations
      })

      if (response) {
        organizations = [response.id]
        Object.assign(
          data,
          formModel.value.organizations && {
            organizations
          }
        )
      }
    }

    isRequestSuccessful = await store.dispatch(
      'member/doUpdate',
      {
        id: record.value.id,
        values: data
      }
    )
  } else {
    // Assign organizations to payload
    Object.assign(
      data,
      formModel.value.organizations && {
        organizations
      }
    )
    // Create new member
    isFormSubmitting.value = true
    isRequestSuccessful = await store.dispatch(
      'member/doCreate',
      {
        data
      }
    )
  }

  isFormSubmitting.value = false

  if (isRequestSuccessful) {
    wasFormSubmittedSuccessfuly.value = true
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

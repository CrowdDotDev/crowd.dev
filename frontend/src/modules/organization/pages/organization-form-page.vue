<template>
  <app-page-wrapper
    :container-class="'md:col-start-1 md:col-span-6 lg:col-start-2 lg:col-span-10'"
  >
    <div class="organization-form-page">
      <el-button
        key="organizations"
        link
        :icon="ArrowPrevIcon"
        class="text-gray-600 btn-link--md btn-link--secondary p-0"
        @click="onCancel"
        >Organizations</el-button
      >
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
            class="form"
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
        ></div>
      </el-container>
    </div>
  </app-page-wrapper>
</template>

<script>
export default {
  name: 'OrganizationFormPage'
}
</script>
<script setup>
import AppOrganizationFormDetails from '@/modules/organization/components/form/organization-form-details'
import AppOrganizationFormIdentities from '@/modules/organization/components/form/organization-form-identities'
import { OrganizationModel } from '@/modules/organization/organization-model'
import { FormSchema } from '@/shared/form/form-schema'
import {
  computed,
  h,
  onMounted,
  onUnmounted,
  defineProps,
  reactive,
  ref,
  watch
} from 'vue'
import {
  onBeforeRouteLeave,
  useRoute,
  useRouter
} from 'vue-router'
import isEqual from 'lodash/isEqual'
import ConfirmDialog from '@/shared/dialog/confirm-dialog.js'
import { useStore } from 'vuex'

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

const props = defineProps({
  id: {
    type: String,
    default: null
  }
})

const { fields } = OrganizationModel
const formSchema = new FormSchema([
  fields.name,
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
  fields.phoneNumbers
])

const router = useRouter()
const route = useRoute()
const store = useStore()

const record = ref(null)
const formRef = ref(null)
const formModel = ref(getInitialModel())

const isPageLoading = ref(true)
const isFormSubmitting = ref(false)
const wasFormSubmittedSuccessfuly = ref(false)

const rules = reactive(formSchema.rules())

// UI Validations
const isEditPage = computed(() => !!route.params.id)
const isFormValid = computed(() => {
  return formSchema.isValidSync(formModel.value)
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
  if (isEditPage.value) {
    const id = route.params.id

    record.value = await store.dispatch(
      'organization/doFind',
      id
    )
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
          name: 'organizationView',
          params: {
            id: record.value.id
          }
        })
      }

      return router.push({ name: 'organization' })
    }
  }
)

function getInitialModel(record) {
  return JSON.parse(
    JSON.stringify(
      formSchema.initialValues({
        name: record ? record.name : '',
        description: record ? record.description : '',
        joinedAt: record ? record.joinedAt : '',
        employees: record ? record.employees : null,
        location: record ? record.location : null,
        website: record ? record.website : null,
        github:
          record && record.github
            ? record.github.handle
            : '',
        twitter:
          record && record.twitter
            ? record.twitter.handle
            : '',
        linkedin:
          record && record.linkedin
            ? record.linkedin.handle
            : '',
        crunchbase:
          record && record.crunchbase
            ? record.crunchbase.handle
            : '',
        revenueRange: record ? record.revenueRange : {},
        emails:
          record && record.emails?.length > 0
            ? record.emails
            : [''],
        phoneNumbers:
          record && record.phoneNumbers?.length > 0
            ? record.phoneNumbers
            : ['']
      })
    )
  )
}

function onReset() {
  formModel.value = isEditPage.value
    ? getInitialModel(record.value)
    : getInitialModel()
}

function onCancel() {
  router.push({ name: 'organization' })
}
async function onSubmit() {
  isFormSubmitting.value = true
  const data = Object.assign(
    {},
    {
      ...formModel.value,
      emails: formModel.value.emails.reduce((acc, item) => {
        if (item !== '') {
          acc.push(item)
        }
        return acc
      }, []),
      phoneNumbers: formModel.value.phoneNumbers.reduce(
        (acc, item) => {
          if (item !== '') {
            acc.push(item)
          }
          return acc
        },
        []
      ),
      github: formModel.value.github
        ? platformPayload('github', formModel.value.github)
        : null,
      linkedin: formModel.value.linkedin
        ? platformPayload(
            'linkedin',
            formModel.value.linkedin
          )
        : null,
      twitter: formModel.value.twitter
        ? platformPayload(
            'twitter',
            formModel.value.twitter
          )
        : null,
      crunchbase: formModel.value.crunchbase
        ? platformPayload(
            'crunchbase',
            formModel.value.crunchbase
          )
        : null
    }
  )
  const action = isEditPage.value
    ? 'organization/doUpdate'
    : 'organization/doCreate'
  const payload = isEditPage.value
    ? { id: props.id, values: data }
    : data

  await store.dispatch(action, payload)
  isFormSubmitting.value = false
  wasFormSubmittedSuccessfuly.value = true
}
function platformPayload(platform, value) {
  if (value && value !== '') {
    return {
      handle: value,
      url: `https://${platform}.com/${value}`
    }
  } else {
    return undefined
  }
}
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
  .el-form--default.el-form--label-top
    .custom-attributes-form
    .el-form-item__content {
    @apply flex mb-0;
  }
}
</style>

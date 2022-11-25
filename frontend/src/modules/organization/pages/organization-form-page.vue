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
import AppPageWrapper from '@/modules/layout/components/page-wrapper.vue'
import { OrganizationModel } from '@/modules/organization/organization-model'
import { FormSchema } from '@/shared/form/form-schema'
import {
  computed,
  h,
  onMounted,
  onUnmounted,
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
import ConfirmDialog from '@/shared/confirm-dialog/confirm-dialog.js'
import { useStore } from 'vuex'
import getAttributesModel from '@/shared/attributes/get-attributes-model.js'

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

const { fields } = OrganizationModel
const formSchema = new FormSchema([
  fields.name,
  fields.description,
  fields.joinedAt,
  fields.tags
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
  const attributes = getAttributesModel(record)

  return JSON.parse(
    JSON.stringify(
      formSchema.initialValues({
        name: record ? record.name : '',
        description: record ? record.description : '',
        joinedAt: record ? record.joinedAt : '',
        ...attributes,
        tags: record ? record.tags : []
      })
    )
  )
}

async function onReset() {
  formModel.value = isEditPage.value
    ? getInitialModel(record.value)
    : getInitialModel()
}

async function onCancel() {
  router.push({ name: 'member' })
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

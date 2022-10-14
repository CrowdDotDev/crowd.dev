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
        class="bg-white rounded-lg shadow shadow-black/15"
      >
        <el-main class="p-6">
          <el-form
            ref="formRef"
            label-position="top"
            :rules="rules"
            :model="formModel"
          >
            <AppMemberFormDetails
              v-model="formModel"
              :fields-value="computedFields"
            />
            <el-divider
              class="!mb-6 !mt-8 !border-gray-200"
            />
            <AppMemberFormIdentities
              v-model="formModel"
              :record="record"
            />
            <el-divider
              class="!mb-6 !mt-16 !border-gray-200"
            />
            <AppMemberFormAttributes
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
            @click="onReset"
            ><i class="ri-arrow-go-back-line"></i>
            <span>Reset changes</span></el-button
          >
          <div class="flex gap-4">
            <el-button
              class="btn btn--md btn--bordered"
              @click="onCancel"
            >
              Cancel
            </el-button>
            <el-button
              :disabled="!isFormValid"
              class="btn btn--md btn--primary"
              @click="doSubmit"
            >
              {{
                isEditPage ? 'Update member' : 'Add member'
              }}
            </el-button>
          </div>
        </el-footer>
      </el-container>
    </div>

    <!-- Manage Custom Attributes Drawer-->
    <AppMemberAttributesDrawer
      v-if="computedAttributes.length"
      v-model="isDrawerOpen"
    />
  </app-page-wrapper>
</template>

<script setup>
import AppPageWrapper from '@/modules/layout/components/page-wrapper.vue'
import AppMemberFormDetails from '@/modules/member/components/member-form-details.vue'
import AppMemberFormIdentities from '@/modules/member/components/member-form-identities.vue'
import AppMemberFormAttributes from '@/modules/member/components/member-form-attributes.vue'
import AppMemberAttributesDrawer from '@/modules/member/components/member-attributes-drawer.vue'
import { MemberModel } from '@/modules/member/member-model'
import { FormSchema } from '@/shared/form/form-schema'
import { h, reactive, ref, computed, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import isEqual from 'lodash/isEqual'
import ConfirmDialog from '@/shared/confirm-dialog/confirm-dialog.js'
import { useStore } from 'vuex'
import getCustomAttributes from '@/shared/fields/get-custom-attributes.js'

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
      fields.platform,
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

const isDrawerOpen = ref(false)

const rules = reactive(formSchema.value.rules())

const computedAttributes = computed(() =>
  Object.values(store.state.member.customAttributes).filter(
    (attribute) => attribute.show
  )
)
const isEditPage = computed(() => !!route.params.id)
const computedFields = computed(() => fields)
const isFormValid = computed(() => {
  return formSchema.value.isValidSync(formModel.value)
})
const hasFormChanged = computed(() => {
  const initialModel = isEditPage.value
    ? getInitialModel(record.value)
    : getInitialModel()

  return !isEqual(initialModel, formModel.value)
})

onMounted(async () => {
  // Fetch custom attributes on mount
  await store.dispatch('member/doFetchCustomAttributes')

  if (isEditPage.value) {
    const id = route.params.id

    record.value = await store.dispatch('member/doFind', id)
    formModel.value = getInitialModel(record.value)
  }
})

function getInitialModel(record) {
  const attributes = Object.entries(
    record?.attributes || {}
  ).reduce((obj, [key, val]) => {
    if (!val.default) {
      return obj
    }

    return {
      ...obj,
      [key]: val.default
    }
  }, {})

  return formSchema.value.initialValues({
    displayName: record ? record.displayName : '',
    email: record ? record.email : '',
    joinedAt: record ? record.joinedAt : '',
    attributes: record ? record.attributes : {},
    ...attributes,
    tags: record ? record.tags : [],
    username: record ? record.username : {},
    platform: record
      ? record.username[Object.keys(record.username)[0]]
      : ''
  })
}

async function onReset() {
  const initialModel = isEditPage.value
    ? getInitialModel(record.value)
    : getInitialModel()

  Object.assign(formModel.value, initialModel)
}

async function onCancel() {
  if (hasFormChanged.value) {
    ConfirmDialog({})
      .then(() => {
        router.push({ name: 'member' })
      })
      .catch(() => {
        return false
      })
  } else {
    router.push({ name: 'member' })
  }
}

async function doSubmit() {
  const formattedAttributes =
    computedAttributes.value.reduce((obj, attribute) => {
      if (!formModel.value[attribute.name]) {
        return obj
      }

      return {
        ...obj,
        [attribute.name]: {
          ...formModel.value.attributes[attribute.name],
          default: formModel.value[attribute.name]
        }
      }
    }, {})

  const data = {
    displayName: formModel.value.displayName,
    email: formModel.value.email,
    joinedAt: formModel.value.joinedAt,
    attributes: formattedAttributes,
    tags: formModel.value.tags.map((t) => t.id),
    username: formModel.value.username,
    platform: formModel.value.platform
  }

  // Edit member
  if (isEditPage.value) {
    await store.dispatch('member/doUpdate', {
      id: record.value.id,
      values: data
    })

    router.push('/members')
  } else {
    // Create new member
    await store.dispatch('member/doCreate', {
      data
    })

    router.push('/members')
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

    & .app-tags-input,
    .el-select {
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

.el-select-dropdown.is-multiple
  .el-select-dropdown__item.selected,
.el-select-dropdown .el-select-dropdown__item.selected {
  @apply font-medium  text-gray-900;
}

.el-select-dropdown.is-multiple
  .el-select-dropdown__item.selected {
  @apply bg-brand-50;
}

.el-select-dropdown.is-multiple
  .el-select-dropdown__item.selected::after {
  @apply bg-gray-900;
}
</style>

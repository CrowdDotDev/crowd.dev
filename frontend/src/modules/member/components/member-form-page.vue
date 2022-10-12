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
      <h4 class="mt-4 mb-6">New member</h4>
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
            <AppMemberFormIdentities v-model="formModel" />
            <el-divider
              class="!mb-6 !mt-16 !border-gray-200"
            />
            <AppMemberFormAttributes v-model="formModel" />
          </el-form>
        </el-main>
        <el-footer
          class="bg-gray-50 flex items-center justify-end gap-4 p-6 h-fit rounded-b-lg"
        >
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
            Add member
          </el-button>
        </el-footer>
      </el-container>
    </div>
  </app-page-wrapper>
</template>

<script setup>
import AppPageWrapper from '@/modules/layout/components/page-wrapper.vue'
import AppMemberFormDetails from '@/modules/member/components/member-form-details.vue'
import AppMemberFormIdentities from '@/modules/member/components/member-form-identities.vue'
import AppMemberFormAttributes from '@/modules/member/components/member-form-attributes.vue'
import { MemberModel } from '@/modules/member/member-model'
import { FormSchema } from '@/shared/form/form-schema'
import { h, reactive, ref, computed, watch } from 'vue'
import { useRouter } from 'vue-router'
import isEqual from 'lodash/isEqual'
import ConfirmDialog from '@/shared/confirm-dialog/confirm-dialog.js'
import { useStore } from 'vuex'

const ArrowPrevIcon = h(
  'i', // type
  {
    class: 'ri-arrow-left-s-line text-base leading-none'
  }, // props
  []
)

const { fields } = MemberModel
const formSchema = new FormSchema([
  fields.displayName,
  fields.email,
  fields.organizations,
  fields.attributes,
  fields.tags,
  fields.username,
  fields.platform,
  fields.customAttributes
])

const router = useRouter()
const store = useStore()

const formRef = ref(null)
const rules = reactive(formSchema.rules())
const formModel = reactive(
  formSchema.initialValues({
    username: {}
  })
)

const computedFields = computed(() => fields)
const isFormValid = computed(() =>
  formSchema.isValidSync(formModel)
)

watch(formModel, (newModel) => {
  console.log(newModel)
})

async function onCancel() {
  const hasFormChanged = !isEqual(
    formSchema.initialValues({
      username: {}
    }),
    formModel
  )

  if (!hasFormChanged) {
    return router.push({ name: 'member' })
  }

  ConfirmDialog()
    .then(() => {
      router.push({ name: 'member' })
    })
    .catch(() => null)
}

async function doSubmit() {
  let createModel = { ...formModel }

  // Create custom attributes if existent
  if ((formModel.customAttributesArray || []).length) {
    const customAttributes = await Promise.all(
      formModel.customAttributesArray.map(
        ({ label, type }) => {
          return store.dispatch(
            'member/doCreateCustomAttributes',
            {
              label,
              type
            }
          )
        }
      )
    )

    // Request failed
    if (customAttributes[0] === undefined) {
      return
    }

    // Add customAttributes to attributes object
    formModel.attributes = {
      ...formModel.attributes,
      ...formModel.customAttributes
    }

    // Delete custom attributes property helpers
    delete createModel.customAttributes
    delete createModel.customAttributesArray
  }

  // Create new member
  await store.dispatch('member/doCreate', {
    data: {
      ...formSchema.cast(createModel),
      // TODO: Improve organizations handling
      tags: createModel.tags,
      organizations: [{ name: createModel.organizations }]
    }
  })
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
    & .el-form-item:not(:last-of-type) {
      @apply mb-6;
    }

    & .app-keywords-input {
      @apply w-full;

      & .el-keywords-input-wrapper {
        @apply gap-2 px-3;

        & .el-tag {
          @apply m-0 h-6 bg-gray-100 border-gray-200;
        }

        & .el-keywords-input {
          &:first-child {
            @apply ml-0;
          }

          &:not(:first-child) {
            @apply ml-1;
          }
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

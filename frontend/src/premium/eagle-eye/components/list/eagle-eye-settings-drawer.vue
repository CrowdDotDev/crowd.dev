<template>
  <app-drawer v-model="drawerModel" title="Feed settings">
    <template #content>
      <div class="pt-2">
        <h5 class="text-base leading-5 font-semibold pb-6">
          Keywords
        </h5>

        <el-form
          ref="formRef"
          :model="form"
          :rules="rules"
          @validate="validate()"
        >
          <!-- include -->
          <section class="pb-8">
            <p
              class="text-2xs leading-4.5 font-semibold text-gray-400 uppercase tracking-1 pb-3"
            >
              Include
              <span class="text-brand-500 font-normal"
                >*</span
              >
            </p>
            <article
              v-for="(include, ii) of form.include"
              :key="ii"
              class="pb-3 flex items-center"
            >
              <div class="flex flex-grow items-start">
                <el-form-item
                  class="mr-3 mb-0 no-margin basis-7/12 is-error-relative"
                  :prop="`include.${ii}.keyword`"
                  :rules="rules.include.$each.keyword"
                >
                  <el-input
                    v-model="include.keyword"
                    placeholder="Keyword"
                  ></el-input>
                </el-form-item>
                <el-form-item
                  class="mr-3 mb-0 no-margin basis-5/12 is-error-relative"
                  :prop="`include.${ii}.match`"
                  :rules="rules.include.$each.match"
                >
                  <el-select
                    v-model="include.match"
                    class="w-full"
                    placeholder="Match type"
                  >
                    <el-option
                      value="semantic"
                      label="Semantic match"
                      class="flex-col !items-start !px-3 !py-2.5 !h-16"
                    >
                      <h6
                        class="text-xs leading-5 font-medium"
                      >
                        Semantic match
                      </h6>
                      <p
                        class="text-2xs leading-5 text-gray-500"
                      >
                        Results semantically related
                      </p>
                    </el-option>
                    <el-option
                      value="exact"
                      label="Exact match"
                      class="flex-col !items-start !px-3 !py-2.5 !h-16"
                    >
                      <h6
                        class="text-xs leading-5 font-medium"
                      >
                        Exact match
                      </h6>
                      <p
                        class="text-2xs leading-5 text-gray-500"
                      >
                        Results containing the keyword
                      </p>
                    </el-option>
                  </el-select>
                </el-form-item>
              </div>
              <div
                class="p-2"
                :class="{ 'cursor-pointer': ii > 0 }"
                @click="ii > 0 ? removeInclude(ii) : null"
              >
                <i
                  class="ri-delete-bin-line text-lg h-5 text-gray-600 flex items-center"
                  :class="{ 'opacity-50': ii <= 0 }"
                ></i>
              </div>
            </article>
            <div class="flex">
              <p
                class="text-sm leading-5 text-brand-500 cursor-pointer"
                @click="addInclude()"
              >
                + Add keyword
              </p>
            </div>
          </section>

          <!-- exclude -->
          <section class="pb-10">
            <p
              class="text-2xs leading-4.5 font-semibold text-gray-400 uppercase tracking-1 pb-3"
            >
              Exclude
            </p>
            <article
              v-for="(exclude, ei) of form.exclude"
              :key="ei"
              class="pb-3 flex items-center"
            >
              <el-form-item
                class="mr-3 mb-0 no-margin flex-grow"
                :prop="`exclude.${ei}.keyword`"
              >
                <el-input
                  v-model="exclude.keyword"
                  placeholder="Keyword"
                ></el-input>
              </el-form-item>
              <div
                class="p-2 cursor-pointer"
                @click="removeExclude(ei)"
              >
                <i
                  class="ri-delete-bin-line text-lg h-5 text-gray-600 flex items-center"
                ></i>
              </div>
            </article>
            <div class="flex">
              <p
                class="text-sm leading-5 text-brand-500 cursor-pointer"
                @click="addExclude()"
              >
                + Add keyword
              </p>
            </div>
          </section>
          <hr />
          <h5
            class="text-base leading-5 font-semibold py-6"
          >
            Platforms
          </h5>

          <!-- date published -->
          <section>
            <h6
              class="text-xs leading-5 font-semibold pb-2"
            >
              Date published
            </h6>
            <div class="pb-8">
              <el-form-item
                prop="datePublished"
                class="mb-0 no-margin"
              >
                <el-radio-group
                  v-model="form.datePublished"
                  class="radio-button-group is-small"
                >
                  <el-radio-button
                    v-for="date of datePublished"
                    :key="date.label"
                    :label="date.label"
                  />
                </el-radio-group>
              </el-form-item>
            </div>
          </section>

          <!-- platforms -->
          <section>
            <el-form-item
              prop="platforms"
              :rules="rules.platforms"
              class="mb-0"
            >
              <div class="w-full">
                <article
                  v-for="(
                    platform, name, index
                  ) in platforms"
                  :key="name"
                  :class="{ 'border-t': index > 0 }"
                  class="h-12 flex items-center justify-between border-gray-200"
                >
                  <div class="flex items-center">
                    <div class="h-6 w-6 mr-4">
                      <img :src="platform.img" />
                    </div>
                    <p class="text-xs leading-5">
                      {{ platform.label }}
                    </p>
                  </div>
                  <div>
                    <el-switch
                      v-model="form.platforms[name]"
                    ></el-switch>
                  </div>
                </article>
              </div>
            </el-form-item>
          </section>
        </el-form>
      </div>
    </template>

    <template #footer>
      <div style="flex: auto" class="-my-2">
        <el-button
          class="btn btn--md btn--transparent mr-3"
          @click="emit('update:modelValue', false)"
          >Cancel
        </el-button>

        <el-button
          type="primary"
          class="btn btn--md btn--primary"
          :loading="loadingUpdateSettings"
          :disabled="!isFormValid"
          @click="onSubmit(formRef)"
          >Update
        </el-button>
      </div>
    </template>
  </app-drawer>
</template>

<script setup>
import datePublished from '@/premium/eagle-eye/constants/eagle-eye-date-published.json'
import platforms from '@/premium/eagle-eye/constants/eagle-eye-platforms.json'
import AppDrawer from '@/shared/drawer/drawer.vue'
import Message from '@/shared/message/message'
import {
  computed,
  defineEmits,
  defineProps,
  onMounted,
  reactive,
  ref,
  watch
} from 'vue'
import {
  mapActions,
  mapGetters,
  mapState
} from '@/shared/vuex/vuex.helpers'

const props = defineProps({
  modelValue: {
    type: Boolean,
    default: false
  }
})

const emit = defineEmits(['update:modelValue'])

const { currentUser } = mapGetters('auth')
const { doUpdateSettings } = mapActions('eagleEye')
const { loadingUpdateSettings } = mapState('eagleEye')

const formRef = ref()

const rules = reactive({
  include: {
    $each: {
      keyword: [
        {
          required: true,
          message: 'This field is required',
          trigger: 'blur'
        }
      ],
      match: [
        {
          required: true,
          message: 'This field is required',
          trigger: 'blur'
        }
      ]
    }
  },
  datePublished: [
    {
      required: true,
      message: 'This field is required',
      trigger: 'blur'
    }
  ],
  platforms: [
    {
      type: 'object',
      trigger: 'change',
      validator: (rule, value, callback) => {
        const trueValues = Object.values({
          ...form.platforms
        }).filter((v) => v)
        if (trueValues.length === 0) {
          callback(
            new Error('Please select at least one platform')
          )
        } else {
          callback()
        }
      }
    }
  ]
})

const form = reactive({
  include: [],
  exclude: [],
  datePublished: '',
  platforms: {}
})

const isFormValid = computed(() => {
  const includeValid = form.include.every(
    (i) => i.keyword.length > 0 && i.match.length > 0
  )
  const platformsValid =
    Object.values({
      ...form.platforms
    }).filter((v) => v).length > 0
  return includeValid && platformsValid
})

const drawerModel = computed({
  get() {
    return props.modelValue
  },
  set(value) {
    emit('update:modelValue', value)
  }
})

watch(
  () => props.modelValue,
  (open) => {
    if (open) {
      fillForm(currentUser.value)
    }
  }
)

const addInclude = () => {
  form.include.push({
    keyword: '',
    match: 'semantic'
  })
}

const removeInclude = (index) => {
  form.include.splice(index, 1)
}

const addExclude = () => {
  form.exclude.push({
    keyword: ''
  })
}

const removeExclude = (index) => {
  form.exclude.splice(index, 1)
}

const fillForm = (user) => {
  if (!user) {
    return
  }
  const { eagleEyeSettings } = user
  const { feed } = eagleEyeSettings
  form.include = [
    ...feed.keywords.map((keyword) => ({
      keyword,
      match: 'semantic'
    })),
    ...feed.exactKeywords.map((keyword) => ({
      keyword,
      match: 'exact'
    }))
  ]
  form.exclude = feed.excludedKeywords.map((keyword) => ({
    keyword
  }))
  Object.keys(platforms).forEach((platform) => {
    form.platforms[platform] =
      feed.platforms.includes(platform)
  })

  form.datePublished = feed.publishedDate
}

const onSubmit = async (formEl) => {
  if (!formEl) return
  await formEl.validate(async (valid) => {
    if (valid) {
      const data = {
        keywords: form.include
          .filter((i) => i.match === 'semantic')
          .map((i) => i.keyword),
        exactKeywords: form.include
          .filter((i) => i.match === 'exact')
          .map((i) => i.keyword),
        excludedKeywords: form.exclude
          .filter((e) => e.keyword.trim().length > 0)
          .map((e) => e.keyword),
        publishedDate: form.datePublished,
        platforms: Object.entries(form.platforms)
          .filter(([, enabled]) => enabled)
          .map(([platform]) => platform)
      }
      await doUpdateSettings({
        ...currentUser.value.eagleEyeSettings,
        feed: data
      })
      Message.success('Feed settings updated!')
      emit('update:modelValue', false)
    }
  })
}

onMounted(() => {
  fillForm(currentUser.value)
})
</script>

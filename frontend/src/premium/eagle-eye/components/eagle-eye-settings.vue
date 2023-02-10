<template>
  <app-drawer
    v-model="drawerModel"
    title="Feed settings"
    width="600px"
  >
    <template #content>
      <div class="pt-2">
        <h5 class="text-base leading-5 font-semibold pb-6">
          Keywords
        </h5>

        <el-form :model="form" :rules="rules">
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
              <div class="flex flex-grow items-center">
                <el-form-item
                  class="mr-3 mb-0 no-margin basis-7/12"
                  :prop="`include.${ii}.keyword`"
                  :rules="rules.include.$each.keyword"
                >
                  <el-input
                    v-model="include.keyword"
                    placeholder="Keyword"
                  ></el-input>
                </el-form-item>
                <el-form-item
                  class="mr-3 mb-0 no-margin basis-5/12"
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
                class="p-2 cursor-pointer"
                @click="removeInclude(ii)"
              >
                <i
                  class="ri-delete-bin-line text-lg h-5 text-gray-600 flex items-center"
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
              <div class="flex flex-grow items-center">
                <el-form-item
                  class="mr-3 mb-0 no-margin basis-7/12"
                  :prop="`exclude.${ei}.keyword`"
                  :rules="rules.exclude.$each.keyword"
                >
                  <el-input
                    v-model="exclude.keyword"
                    placeholder="Keyword"
                  ></el-input>
                </el-form-item>
                <el-form-item
                  class="mr-3 mb-0 no-margin basis-5/12"
                  :prop="`exclude.${ei}.match`"
                  :rules="rules.exclude.$each.match"
                >
                  <el-select
                    v-model="exclude.match"
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
              <el-form-item prop="datePublished">
                <el-radio-group
                  v-model="form.datePublished"
                  class="radio-button-group is-small"
                >
                  <el-radio-button label="last24h"
                    >Last 24h</el-radio-button
                  >
                  <el-radio-button label="last7d"
                    >Last 7 days</el-radio-button
                  >
                  <el-radio-button label="last14d"
                    >Last 14 days</el-radio-button
                  >
                  <el-radio-button label="last30d"
                    >Last 30 days</el-radio-button
                  >
                  <el-radio-button label="last90d"
                    >Last 90 days</el-radio-button
                  >
                </el-radio-group>
              </el-form-item>
            </div>
          </section>

          <!-- platforms -->
          <section>
            <el-form-item
              prop="platforms"
              :rules="rules.platforms"
            >
              <div class="w-full">
                <article
                  class="h-12 flex items-center justify-between border-b border-gray-200"
                >
                  <div class="flex items-center">
                    <div class="h-6 w-6 mr-4">
                      <img
                        src="https://cdn-icons-png.flaticon.com/512/5969/5969051.png"
                      />
                    </div>
                    <p class="text-xs leading-5">DEV</p>
                  </div>
                  <div>
                    <el-switch
                      v-model="form.platforms['dev']"
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
      <!--      <div style="flex: auto">-->
      <!--        <el-button-->
      <!--          class="btn btn&#45;&#45;md btn&#45;&#45;transparent mr-3"-->
      <!--          @click="handleCancel"-->
      <!--        >Cancel-->
      <!--        </el-button>-->
      <!--        <el-button-->
      <!--          type="primary"-->
      <!--          class="btn btn&#45;&#45;md btn&#45;&#45;primary"-->
      <!--          :loading="loading"-->
      <!--          @click="doSubmit"-->
      <!--        >Update-->
      <!--        </el-button>-->
      <!--      </div>-->
    </template>
  </app-drawer>
</template>

<script setup>
import AppDrawer from '@/shared/drawer/drawer.vue'
import {
  computed,
  defineEmits,
  defineProps,
  reactive
} from 'vue'

const props = defineProps({
  modelValue: {
    type: Boolean,
    default: false
  }
})

const emit = defineEmits(['update:modelValue'])

const rules = reactive({
  include: {
    $each: {
      keyword: [
        {
          required: true,
          message: 'Please enter keyword',
          trigger: 'blur'
        }
      ],
      match: [
        {
          required: true,
          message: 'Please select match type',
          trigger: 'blur'
        }
      ]
    }
  },
  exclude: {
    $each: {
      keyword: [
        {
          required: true,
          message: 'Please enter keyword',
          trigger: 'blur'
        }
      ],
      match: [
        {
          required: true,
          message: 'Please select match type',
          trigger: 'blur'
        }
      ]
    }
  },
  datePublished: [
    {
      required: true,
      message: 'Please select date published',
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

const addInclude = () => {
  form.include.push({
    keyword: '',
    match: ''
  })
}

const removeInclude = (index) => {
  form.include.splice(index, 1)
}

const addExclude = () => {
  form.exclude.push({
    keyword: '',
    match: ''
  })
}

const removeExclude = (index) => {
  form.include.splice(index, 1)
}

const drawerModel = computed({
  get() {
    return props.modelValue
  },
  set(value) {
    emit('update:modelValue', value)
  }
})
</script>

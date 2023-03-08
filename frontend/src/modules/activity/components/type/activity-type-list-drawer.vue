<template>
  <app-drawer
    v-model="isVisible"
    :size="480"
    title="Manage activity types"
  >
    <template #content>
      <div class="-mt-4">
        <section class="pb-10">
          <h6
            class="text-base leading-5 font-semibold pb-3"
          >
            Custom
          </h6>
          <app-activity-type-list class="mb-4">
            <app-activity-type-list-item
              platform="Config conference"
            >
              <template #after>
                <app-activity-type-dropdown />
              </template>
            </app-activity-type-list-item>
          </app-activity-type-list>
          <p
            class="text-sm leading-5 font-medium text-brand-500 cursor-pointer"
            @click="isFormModalOpen = true"
          >
            + Add activity type
          </p>
        </section>
        <section>
          <h6
            class="text-base leading-5 font-semibold pb-3"
          >
            Default
          </h6>
          <app-activity-type-list class="mb-4">
            <app-activity-type-list-item
              platform="github"
            />
          </app-activity-type-list>
        </section>
      </div>
    </template>
    <template #footer>
      <!--      <router-link-->
      <!--        :to="{ name: 'onboard', query: { action: 'new' } }"-->
      <!--      ><el-button class="btn btn&#45;&#45;md btn&#45;&#45;primary"-->
      <!--      >Add workspace</el-button-->
      <!--      ></router-link-->
      <!--      >-->
    </template>
  </app-drawer>
  <app-activity-type-form-modal v-model="isFormModalOpen" />
</template>

<script>
export default {
  name: 'AppActivityTypeListDrawer'
}
</script>

<script setup>
import {
  defineEmits,
  defineProps,
  computed,
  ref
} from 'vue'
import AppDrawer from '@/shared/drawer/drawer.vue'
import AppActivityTypeList from '@/modules/activity/components/type/activity-type-list.vue'
import AppActivityTypeListItem from '@/modules/activity/components/type/activity-type-list-item.vue'
import AppActivityTypeDropdown from '@/modules/activity/components/type/activity-type-dropdown.vue'
import AppActivityTypeFormModal from '@/modules/activity/components/type/activity-type-form-modal.vue'

const props = defineProps({
  modelValue: {
    type: Boolean,
    default: false
  }
})

const emit = defineEmits(['update:modelValue'])

const isFormModalOpen = ref(true)

const isVisible = computed({
  get() {
    return props.modelValue
  },
  set(value) {
    emit('update:modelValue', value)
  }
})
</script>

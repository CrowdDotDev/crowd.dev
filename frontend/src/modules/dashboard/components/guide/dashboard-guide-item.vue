<template>
  <article
    class="border-t first:border-none border-gray-200"
  >
    <!--         header-->
    <div
      class="py-4 flex justify-between"
      :class="{ 'cursor-pointer': !guide.completed }"
      @click="
        !props.guide.completed ? emit('header-click') : null
      "
    >
      <div class="flex-grow pr-1">
        <h6
          class="text-xs"
          :class="
            props.guide.completed
              ? 'line-through text-gray-500 font-medium'
              : 'font-semibold'
          "
        >
          {{ props.guide.title }}
        </h6>
      </div>
      <div class="w-5 h-5">
        <i
          v-if="props.guide.completed"
          class="ri-checkbox-circle-fill text-lg text-green-500 h-5 flex items-center"
        ></i>
        <div v-else>
          <i
            class="ri-arrow-down-s-line text-lg text-gray-400 h-5 flex items-center transform transition"
            :class="{
              'rotate-180': active
            }"
          ></i>
        </div>
      </div>
    </div>

    <!-- content -->
    <div
      class="transition-all ease-linear overflow-hidden"
      :class="active ? 'max-h-88' : 'max-h-0'"
    >
      <div class="pb-1">
        <div
          v-if="
            props.guide.videoLink &&
            props.guide.loomThumbnailUrl
          "
          class="relative rounded bg-gray-100 mb-4 w-full h-20 flex items-center justify-center bg-cover group cursor-pointer"
          :style="{
            'background-image': `url(${props.guide.loomThumbnailUrl})`
          }"
          @click="emit('open')"
        >
          <i
            class="ri-play-circle-fill text-white text-2xl opacity-50 transform h-8 flex items-center group-hover:opacity-100 transition"
          ></i>
        </div>
        <p class="text-xs text-gray-600 leading-5 mb-4">
          {{ props.guide.body }}
        </p>
        <router-link :to="props.guide.buttonLink">
          <el-button
            v-if="props.guide.buttonText"
            class="btn btn--primary btn--sm w-full mb-4 leading-5"
          >
            {{ props.guide.buttonText }}
          </el-button>
        </router-link>
      </div>
    </div>
  </article>
</template>

<script>
export default {
  name: 'AppDashboardGuideItem'
}
</script>

<script setup>
import { defineProps, defineEmits } from 'vue'

const props = defineProps({
  guide: {
    type: Object,
    required: true
  },
  active: {
    type: Boolean,
    required: false,
    default: false
  }
})

const emit = defineEmits(['header-click', 'open'])
</script>

<template>
  <div>
    <!-- Education -->
    <div v-if="member.attributes.education" class="flex items-center mb-4 mt-10">
      <div
        class="font-medium text-black mr-2"
      >
        Education
      </div>
      <el-tooltip
        v-if="getAttributeSourceName(member.attributes.education)"
        :content="`Source: ${getAttributeSourceName(member.attributes.education)}`"
        placement="top"
        trigger="hover"
      >
        <app-svg name="source" class="h-3 w-3" />
      </el-tooltip>
    </div>

    <app-member-custom-attributes-array-renderer
      title="Education"
      :attribute="member.attributes.education"
      more-label="items"
    >
      <template #itemSlot="{ item }">
        <div class="block py-3">
          <div
            class="text-xs text-gray-900 break-keep text-left"
          >
            {{ item.major }} {{ item.specialization }}
          </div>
          <div class="text-gray-500 text-2xs">
            {{ item.campus }}
          </div>
        </div>
      </template>
    </app-member-custom-attributes-array-renderer>

    <!-- Certifications -->
    <div class="flex items-center mb-4 mt-10">
      <div
        v-if="member.attributes.certifications"
        class="font-medium text-black mr-2"
      >
        Certifications
      </div>
      <el-tooltip
        v-if="getAttributeSourceName(member.attributes.certifications)"
        :content="`Source: ${getAttributeSourceName(member.attributes.certifications)}`"
        placement="top"
        trigger="hover"
      >
        <app-svg name="source" class="h-3 w-3" />
      </el-tooltip>
    </div>

    <app-member-custom-attributes-array-renderer
      title="Certifications"
      :attribute="member.attributes.certifications"
      more-label="items"
    >
      <template #itemSlot="{ item }">
        <div class="block py-3">
          <div
            class="text-xs text-gray-900 break-keep text-left"
          >
            {{ item.title }}
          </div>
          <div class="text-gray-500 text-2xs">
            {{ item.description }}
          </div>
        </div>
      </template>
    </app-member-custom-attributes-array-renderer>

    <!-- Awards -->
    <div class="flex items-center mb-4 mt-10">
      <div
        v-if="member.attributes.awards"
        class="font-medium text-black mr-2"
      >
        Awards
      </div>
      <el-tooltip
        v-if="getAttributeSourceName(member.attributes.awards)"
        :content="`Source: ${getAttributeSourceName(member.attributes.awards)}`"
        placement="top"
        trigger="hover"
      >
        <app-svg name="source" class="h-3 w-3" />
      </el-tooltip>
    </div>
    <app-member-custom-attributes-array-renderer
      title="Awards"
      :attribute="member.attributes.awards"
      more-label="items"
    >
      <template #itemSlot="{ item }">
        <div
          class="text-xs text-gray-900 break-keep text-left py-3"
        >
          {{ item }}
        </div>
      </template>
    </app-member-custom-attributes-array-renderer>
  </div>
</template>

<script setup>
import { defineProps } from 'vue';
import { getAttributeSourceName } from '@/shared/helpers/attribute.helpers';
import AppSvg from '@/shared/svg/svg.vue';
import AppMemberCustomAttributesArrayRenderer from './_aside-custom-attributes-array-renderer.vue';

defineProps({
  member: {
    type: Object,
    default: () => {},
  },
});
</script>

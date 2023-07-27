<template>
  <div>
    <!-- Education -->
    <div
      v-if="member.attributes.education"
      class="font-medium text-black mb-4 mt-10"
    >
      Education
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
    <div
      v-if="member.attributes.certifications"
      class="font-medium text-black mb-4 mt-10"
    >
      Certifications
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
    <div
      v-if="member.attributes.awards"
      class="font-medium text-black mb-4 mt-10"
    >
      Awards
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
import AppMemberCustomAttributesArrayRenderer from './_aside-custom-attributes-array-renderer.vue';

defineProps({
  member: {
    type: Object,
    default: () => {},
  },
});
</script>

<template>
  <section v-bind="$attrs">
    <div class="flex items-center justify-between pb-8">
      <h6>
        Contributor details
      </h6>
      <lf-button
        v-if="hasPermission(LfPermission.memberEdit)"
        type="secondary"
        size="small"
        @click="edit = true"
      >
        <lf-icon name="pencil-line" />
        Edit attributes
      </lf-button>
    </div>
    <div>
      <!-- Biography -->
      <article v-if="bio" class="border-b border-gray-100 flex py-3">
        <div class="w-5/12">
          <div class="flex items-center">
            <lf-icon name="file-list-2-line" :size="16" class="mr-1 text-gray-400" />
            <span class="text-gray-500 text-medium">Biography</span>
          </div>
        </div>
        <div class="w-7/12">
          <p class="text-medium">
            {{ bio }}
          </p>
        </div>
      </article>

      <!-- Location -->
      <article v-if="location" class="border-b border-gray-100 flex py-3">
        <div class="w-5/12">
          <div class="flex items-center">
            <lf-icon name="map-pin-line" :size="16" class="mr-1 text-gray-400" />
            <span class="text-gray-500 text-medium">Location</span>
          </div>
        </div>
        <div class="w-7/12">
          <p class="text-medium">
            {{ location }}
          </p>
        </div>
      </article>

      <!-- Tags -->
      <article v-if="tags.length" class="border-b border-gray-100 flex py-3">
        <div class="w-5/12">
          <div class="flex items-center">
            <lf-icon name="price-tag-3-line" :size="16" class="mr-1 text-gray-400" />
            <span class="text-gray-500 text-medium">Tags</span>
          </div>
        </div>
        <div class="w-7/12">
          <div class="flex flex-wrap gap-2">
            <lf-badge v-for="tag of tags" :key="tag.id" type="secondary">
              {{ tag.name }}
            </lf-badge>
          </div>
        </div>
      </article>

      <!-- Custom -->
      <article v-for="(value, attr) in customAttributes" :key="attr" class="border-b border-gray-100 flex py-3">
        <div class="w-5/12">
          <div class="flex items-center">
            <lf-icon name="price-tag-3-line" :size="16" class="mr-1 text-gray-400" />
            <span class="text-gray-500 text-medium">{{ transformToLabel(attr) }}</span>
          </div>
        </div>
        <div class="w-7/12">
          <p class="text-medium">
            {{ value.default }}
          </p>
        </div>
      </article>
    </div>
  </section>
  <app-member-manage-attributes-drawer
    v-if="edit"
    v-model="edit"
    :member="props.contributor"
  />
</template>

<script setup lang="ts">
import LfButton from '@/ui-kit/button/Button.vue';
import LfIcon from '@/ui-kit/icon/Icon.vue';
import AppMemberManageAttributesDrawer from '@/modules/member/components/member-manage-attributes-drawer.vue';
import { Contributor } from '@/modules/contributor/types/Contributor';
import { computed, ref } from 'vue';
import LfBadge from '@/ui-kit/badge/Badge.vue';
import { LfPermission } from '@/shared/modules/permissions/types/Permissions';
import usePermissions from '@/shared/modules/permissions/helpers/usePermissions';

const props = defineProps<{
  contributor: Contributor,
}>();

const { hasPermission } = usePermissions();

const edit = ref<boolean>(false);

const bio = computed(() => props.contributor.attributes.bio?.default);
const location = computed(() => props.contributor.attributes.location?.default);
const tags = computed(() => props.contributor.tags);

const eliminateAttributes = [
  'bio',
  'url',
  'avatarUrl',
  'location',
  'emails',
  'jobTitle',
  'workExperiences',
  'certifications',
  'education',
  'awards',
];

const customAttributes = computed(() => {
  const attrs = { ...props.contributor.attributes };
  eliminateAttributes.forEach((attr) => {
    delete attrs[attr];
  });
  return attrs;
});

const transformToLabel = (property: string) => {
  const label = property.replace(/([A-Z])/g, ' $1').toLowerCase();
  return label.charAt(0).toUpperCase() + label.slice(1);
};
</script>

<script lang="ts">
export default {
  name: 'LfContributorDetailsAttributes',
};
</script>

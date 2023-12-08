<template>
  <div class="member-view-custom-attributes">
    <div class="flex items-center justify-between">
      <div class="flex items-center">
        <div class="font-medium text-black mr-2">
          Attributes
        </div>
        <el-tooltip
          v-if="attributesSameSource"
          :content="`Source: ${attributesSameSource}`"
          placement="top"
          trigger="hover"
        >
          <app-svg name="source" class="h-3 w-3" />
        </el-tooltip>
      </div>

      <el-button
        class="btn btn-link btn-link--primary"
        :disabled="isEditLockedForSampleData"
        @click="attributesDrawer = true"
      >
        <i class="ri-pencil-line" /><span>Edit</span>
      </el-button>
    </div>
    <div
      v-if="!computedCustomAttributes.length"
      class="py-3 text-gray-500 text-xs italic"
    >
      No attributes defined
    </div>
    <div v-else>
      <div v-if="member.lastEnriched" class="attribute">
        <p class="title">
          Last enrichment
        </p>
        <p class="value">
          {{
            formatDate({
              timestamp: props.member.lastEnriched,
              subtractDays: null,
              subtractMonths: null,
              format: 'DD MMMM YYYY',
            })
          }}
        </p>
      </div>
      <div
        v-for="attribute of computedCustomAttributes"
        :key="attribute.id"
        class="attribute"
      >
        <cr-enrichment-sneak-peak type="contact">
          <template #default="{ enabled }">
            <div>
              <div class="flex items-center">
                <p class="title pr-2" :class="{ '!text-purple-400': !enabled }">
                  {{ attribute.label }}
                  <el-tooltip
                    content="Skills are sorted by relevance"
                    placement="top"
                  >
                    <i
                      v-if="attribute.name === 'skills'"
                      class="ri-information-line"
                    />
                  </el-tooltip>
                </p>
                <el-tooltip
                  v-if="!attributesSameSource && getAttributeSourceName(props.member.attributes[attribute.name])"
                  :content="`Source: ${getAttributeSourceName(props.member.attributes[attribute.name])}`"
                  placement="top"
                  trigger="hover"
                  :disabled="!enabled"
                >
                  <app-svg name="source" class="h-3 w-3" />
                </el-tooltip>
              </div>
              <div v-if="!enabled" class="mt-1">
                <div class="w-full h-3 bg-gradient-to-r from-gray-100 to-gray-50" />
              </div>
              <div
                v-else-if="attribute.type === 'multiSelect'"
                class="multiSelect -mt-1"
              >
                <app-member-custom-attributes-array-renderer
                  :title="attribute.label"
                  :attribute="member.attributes[attribute.name]"
                  more-label=""
                  :slice-size="5"
                  :with-separators="false"
                  wrapper-class="flex flex-wrap -mx-1 mt-2 -mb-1"
                  item-class="border border-gray-200 px-2.5 text-xs py-1 rounded-md h-fit text-gray-900 m-1 inline-flex break-keep"
                >
                  <template #itemSlot="{ item }">
                    {{ item }}
                  </template>
                </app-member-custom-attributes-array-renderer>
              </div>
              <p v-else class="value break-words">
                {{
                  formattedComputedAttributeValue(
                    member.attributes[attribute.name].default,
                  )
                }}
              </p>
            </div>
          </template>
        </cr-enrichment-sneak-peak>
      </div>
    </div>
    <div class="-mx-2 pt-2">
      <cr-enrichment-sneak-peak-content type="contact" :dark="true" />
    </div>

    <app-member-manage-attributes-drawer
      v-if="attributesDrawer"
      v-model="attributesDrawer"
      :member="member"
    />
  </div>
</template>

<script setup>
import { defineProps, computed, ref } from 'vue';
import { useStore } from 'vuex';
import moment from 'moment';
import { formatDate } from '@/utils/date';

import { MemberPermissions } from '@/modules/member/member-permissions';
import { useMemberStore } from '@/modules/member/store/pinia';
import { storeToRefs } from 'pinia';
import { getAttributeSourceName } from '@/shared/helpers/attribute.helpers';
import AppSvg from '@/shared/svg/svg.vue';
import CrEnrichmentSneakPeak from '@/shared/modules/enrichment/components/encirhment-sneak-peak.vue';
import CrEnrichmentSneakPeakContent from '@/shared/modules/enrichment/components/encirhment-sneak-peak-content.vue';
import AppMemberManageAttributesDrawer from '../../member-manage-attributes-drawer.vue';
import AppMemberCustomAttributesArrayRenderer from './_aside-custom-attributes-array-renderer.vue';

const props = defineProps({
  member: {
    type: Object,
    default: () => {},
  },
});

const store = useStore();

const memberStore = useMemberStore();
const { customAttributes } = storeToRefs(memberStore);

const attributesDrawer = ref(false);

const isEditLockedForSampleData = computed(() => new MemberPermissions(
  store.getters['auth/currentTenant'],
  store.getters['auth/currentUser'],
).editLockedForSampleData);

const computedCustomAttributes = computed(() => Object.values(customAttributes.value)
  .filter((attribute) => (
    attribute.show
        && ![
          'bio',
          'url',
          'location',
          'emails',
          'jobTitle',
          'workExperiences', // we render them in _aside-work-experience
          'certifications', // we render them in _aside-work-certifications
          'education', // we render them in _aside-work-education
          'awards', // we render them in _aside-work-awards
        ].includes(attribute.name)
        && props.member.attributes[attribute.name]
  ))
  .sort((a, b) => {
    if (props.member.attributes[a.name].enrich) {
      return props.member.attributes[b.name].enrich
        ? 0
        : -1;
    }
    return 1;
  }));

const attributesSameSource = computed(() => {
  const sources = computedCustomAttributes.value.map((attribute) => getAttributeSourceName(props.member.attributes[attribute.name]));
  const uniqueSources = [...new Set(sources)];
  if (uniqueSources.length === 1) {
    return uniqueSources[0];
  }
  return null;
});

const formattedComputedAttributeValue = (value) => {
  const dateFormat = 'YYYY-MM-DD';

  return moment(value, dateFormat, true).isValid()
    ? formatDate({
      timestamp: value,
    })
    : value;
};
</script>

<style lang="scss">
.member-view-custom-attributes {
  .attribute {
    @apply py-3 border-b border-gray-200;
    &:last-of-type {
      @apply border-none;
    }
    .title {
      @apply text-gray-400 font-medium text-2xs;
    }
    .value {
      @apply mt-1 text-gray-900 text-xs;
    }
  }
}
</style>

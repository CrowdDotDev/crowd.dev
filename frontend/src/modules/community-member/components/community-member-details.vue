<template>
  <div class="panel community-member-details">
    <div class="community-member-details-header">
      <app-avatar size="xl" :entity="member"> </app-avatar>
      <div class="font-semibold text-lg mt-2">
        {{ computedUsername }}
      </div>
      <app-community-member-engagement-level
        :member="member"
      />
      <app-community-member-dropdown
        v-if="showDropdown"
        :show-view-member="false"
        :member="member"
      ></app-community-member-dropdown>
    </div>
    <div class="mt-8">
      <div class="text-sm">
        <div class="flex items-center mb-2">
          <i
            class="ri-map-pin-fill text-secondary-500 mr-1"
          ></i>
          <div v-if="member.location">
            {{ member.location.split('(timezone)')[0] }}
          </div>
          <div v-else>No location added</div>
        </div>
        <div v-if="member.bio" class="mb-4">
          {{ member.bio }}
        </div>
        <app-tag-list
          :member="member"
          class="mt-4"
          @tags-updated="$emit('updated')"
        />
      </div>
      <app-community-member-channels
        :member="member"
        class="mb-4 mt-8"
      ></app-community-member-channels>
    </div>
    <hr class="mt-6 pb-6" />
    <div class="community-member-details-info">
      <div class="community-member-details-info-general">
        <div class="font-semibold mb-1">General</div>
        <div
          class="flex justify-between items-center w-full"
        >
          <div class="w-1/3">
            <span class="opacity-50">Joined At</span>
          </div>
          <div class="w-2/3 text-right font-semibold">
            <span>{{
              formattedDate(member.joinedAt, 'DD MMM, YYYY')
            }}</span>
          </div>
        </div>
        <div
          class="flex justify-between items-center w-full"
        >
          <div class="w-1/3">
            <span class="opacity-50">Activities</span>
          </div>
          <div class="w-2/3 text-right font-semibold">
            <span>{{ userActivities.length }}</span>
          </div>
        </div>

        <div
          class="flex justify-between items-center w-full"
        >
          <div class="w-1/3">
            <span
              class="opacity-50 inline-flex items-center"
            >
              <span class="inline-flex mr-1">Reach</span>
              <el-tooltip placement="top">
                <template #content>
                  Combined followers on connected social
                  channels<br /><span class="italic"
                    >(Requires Twitter Integration)</span
                  >
                </template>
                <i
                  class="ri-information-line inline-flex items-center mr-2"
                ></i>
              </el-tooltip>
            </span>
          </div>
          <div class="w-2/3 text-right font-semibold">
            <app-community-member-reach
              :member="member"
              class="flex justify-end"
            />
          </div>
        </div>
        <div
          v-if="member.organisation"
          class="flex justify-between items-center w-full"
        >
          <div class="w-1/3">
            <span class="opacity-50">Organisation</span>
          </div>
          <div class="w-2/3 text-right font-semibold">
            <span>{{ member.organisation }}</span>
          </div>
        </div>
      </div>
      <div
        v-if="member.info"
        class="community-member-details-info-custom"
      >
        <div
          v-for="attribute in Object.keys(member.info)"
          :key="attribute"
          class="flex justify-between items-start w-full"
        >
          <div class="w-1/3">
            <span class="opacity-50">{{
              capitalizeWords(attribute)
            }}</span>
          </div>
          <div class="w-2/3 text-right font-semibold">
            <span>{{ member.info[attribute] }}</span>
          </div>
        </div>
      </div>
      <div
        v-if="userIntegrations.length > 0"
        class="community-member-details-info-integrations"
      >
        <el-collapse>
          <el-collapse-item
            v-for="integration in userIntegrations"
            :key="integration"
            :name="integration"
          >
            <template #title>{{
              capitalizeWords(integration)
            }}</template>
            <div
              v-for="attribute in Object.keys(
                member.crowdInfo[integration]
              )"
              :key="attribute"
              class="flex items-start justify-between"
            >
              <div class="w-1/3 opacity-50">
                {{ capitalizeWords(attribute) }}
              </div>
              <div class="w-2/3 text-right font-semibold">
                {{
                  member.crowdInfo[integration][attribute]
                }}
              </div>
            </div>
          </el-collapse-item>
        </el-collapse>
      </div>
    </div>
  </div>
</template>

<script>
import CommunityMemberDropdown from './community-member-dropdown'
import TagList from '@/modules/tag/components/tag-list'
import CommunityMemberChannels from './community-member-channels'
import CommunityMemberEngagementLevel from './community-member-engagement-level'
import CommunityMemberReach from './community-member-reach'
import moment from 'moment'
import integrationsJson from '@/jsons/integrations'

export default {
  name: 'AppCommunityMemberDetails',
  components: {
    'app-community-member-dropdown': CommunityMemberDropdown,
    'app-community-member-channels': CommunityMemberChannels,
    'app-tag-list': TagList,
    'app-community-member-engagement-level': CommunityMemberEngagementLevel,
    'app-community-member-reach': CommunityMemberReach
  },
  props: {
    member: {
      type: Object,
      default: () => {}
    },
    showDropdown: {
      type: Boolean,
      default: true
    }
  },
  emits: ['updated'],
  computed: {
    userActivities() {
      return this.member.activities.map((a) => {
        return Object.assign({}, a, {
          communityMember: this.record
        })
      })
    },

    userIntegrations() {
      return Object.keys(this.member.crowdInfo)
        .filter((k) =>
          integrationsJson
            .map((i) => i.platform)
            .includes(k)
        )
        .filter(
          (k) =>
            Object.values(this.member.crowdInfo[k]).length >
            0
        )
    },

    computedUsername() {
      return this.member.username.crowdUsername
    }
  },

  methods: {
    formattedDate(value, format) {
      return moment(value).format(format)
    },
    capitalizeWords(value) {
      return value
        .split(' ')
        .map((c) => {
          return c.charAt(0).toUpperCase() + c.slice(1)
        })
        .join(' ')
    }
  }
}
</script>

<style lang="scss">
.community-member-details {
  @apply relative overflow-visible;

  &-header {
    @apply flex flex-col items-center justify-center;
  }

  &-info {
    @apply text-sm text-black leading-normal;

    &-integrations {
      @apply mt-4;
    }
  }

  .el-collapse {
    @apply border-none;
    &-item__wrap,
    &-item__header {
      @apply border-none;
    }
    &-item__header {
      @apply h-6 text-sm font-semibold text-sm;
    }
    &-item__content {
      @apply mt-0 relative pb-2 text-sm;
    }
  }

  .el-dropdown {
    @apply absolute right-0 top-0 mt-3 mr-5;
  }
}
</style>

<template>
  <div class="py-8 px-8">
    <h4 class="text-gray-900">
      Eagle Eye
    </h4>

    <div class="text-gray-500 text-xs mt-1">
      Discover and engage with relevant content across
      various community platforms.
    </div>

    <div v-if="eagleEyeFeedSettings">
      <!-- Feed Settings-->
      <el-button
        class="btn btn--full btn--md btn--secondary mt-6"
        @click="settingsDrawerOpen = true"
      >
        <i class="ri-sound-module-line text-lg" /><span>Feed settings</span>
      </el-button>
      <!-- Keywords -->
      <div
        v-if="
          keywords.length
            || exactKeywords.length
            || excludedKeywords.length
        "
        class="mt-8 mb-6"
      >
        <div class="eagle-eye-settings-small-title">
          Keywords
        </div>
        <div class="flex flex-wrap gap-2">
          <div
            v-for="keyword in keywords"
            :key="keyword"
            class="eagle-eye-keyword"
          >
            {{ keyword }}
          </div>
          <div
            v-for="exactKeyword in exactKeywords"
            :key="exactKeyword"
            class="eagle-eye-keyword"
          >
            "{{ exactKeyword }}"
          </div>
          <div
            v-for="excludedKeyword in excludedKeywords"
            :key="excludedKeyword"
            class="eagle-eye-keyword excluded"
          >
            <el-tooltip
              placement="top"
              content="Excluded keyword"
            >
              <span>
                {{ excludedKeyword }}
              </span>
            </el-tooltip>
          </div>
        </div>
      </div>

      <!-- Published date -->
      <div v-if="publishedDate">
        <div class="eagle-eye-settings-small-title">
          Published date
        </div>
        <div class="text-gray-900 text-xs mb-6">
          {{ publishedDate }}
        </div>
      </div>

      <!-- Platforms -->
      <div v-if="platforms.length" class="mb-6">
        <div class="eagle-eye-settings-small-title">
          Platforms
        </div>
        <div class="flex flex-col gap-4">
          <div
            v-for="platform in platforms"
            :key="platform"
            class="flex items-center gap-3"
          >
            <img
              :alt="platformOptions[platform].label"
              :src="platformOptions[platform].img"
              class="w-5 h-5"
            />
            <span class="text-xs text-gray-900">{{
              platformOptions[platform].label
            }}</span>
          </div>
        </div>
      </div>

      <!-- AI replies -->
      <div v-if="platforms.length" class="mb-10">
        <div class="eagle-eye-settings-small-title">
          AI replies
        </div>
        <div class="flex flex-col gap-4">
          <div class="flex items-center gap-3">
            <div
              class="w-5 h-5 rounded-md bg-gray-900 flex items-center justify-center"
            >
              <i
                class="ri-lightbulb-flash-line text-sm text-white"
              />
            </div>
            <span class="text-xs text-gray-900">{{
              aiRepliesEnabled ? 'Activated' : 'Deactivated'
            }}</span>
          </div>
        </div>
      </div>

      <!-- Email Digest settings -->
      <app-eagle-eye-email-digest-card />
      <app-eagle-eye-settings-drawer
        v-model="settingsDrawerOpen"
      />
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue';
import platformOptions from '@/premium/eagle-eye/constants/eagle-eye-platforms.json';
import AppEagleEyeEmailDigestCard from '@/premium/eagle-eye/components/list/eagle-eye-email-digest-card.vue';
import AppEagleEyeSettingsDrawer from '@/premium/eagle-eye/components/list/eagle-eye-settings-drawer.vue';
import { mapGetters } from '@/shared/vuex/vuex.helpers';

const { currentUser, currentTenant } = mapGetters('auth');

const eagleEyeSettings = computed(
  () => currentUser?.value?.tenants.find(
    (tu) => tu.tenantId === currentTenant?.value.id,
  )?.settings.eagleEye,
);

const settingsDrawerOpen = ref(false);

const eagleEyeFeedSettings = computed(() => eagleEyeSettings.value?.feed);
const keywords = computed(
  () => eagleEyeFeedSettings.value.keywords,
);

const exactKeywords = computed(
  () => eagleEyeFeedSettings.value.exactKeywords,
);

const excludedKeywords = computed(
  () => eagleEyeFeedSettings.value.excludedKeywords,
);

const platforms = computed(
  () => eagleEyeFeedSettings.value.platforms,
);

const publishedDate = computed(
  () => eagleEyeFeedSettings.value.publishedDate,
);

const aiRepliesEnabled = computed(() => eagleEyeSettings.value?.aiReplies);
</script>

<style lang="scss" scoped>
.eagle-eye-settings-small-title {
  @apply mb-3 uppercase text-gray-400 text-2xs font-semibold;
}

.eagle-eye-keyword {
  @apply text-xs text-gray-900 px-2 h-6 flex items-center bg-white border-gray-200 border rounded-md;

  &.excluded {
    @apply text-gray-500 line-through decoration-gray-500;
  }
}
</style>

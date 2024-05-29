<template>
  <app-drawer
    v-model="drawerModel"
    size="600px"
    title="Edit identities"
    custom-class="identities-drawer"
    :show-footer="false"
  >
    <template #content>
      <div class="-mt-8 z-10 pb-6">
        <cr-dropdown width="260px">
          <template #trigger>
            <div class="flex gap-2 text-xs text-primary-500 font-semibold items-center cursor-pointer">
              <i class="ri-add-line text-base" />Add identity
            </div>
          </template>
          <div class="max-h-64 overflow-auto">
            <cr-dropdown-item v-for="platform of platforms" :key="platform.platform" @click="addIdentity(platform.platform)">
              <img :src="platform.image" :alt="platform.name" class="h-4 w-4" />
              <span>{{ platform.name }}</span>
            </cr-dropdown-item>
          </div>
        </cr-dropdown>
      </div>
      <div class="border-t border-gray-200 -mx-6 px-6">
        <div class="gap-4 flex flex-col pt-6 pb-10">
          <template v-for="{ platform } of platforms" :key="platform">
            <template v-for="(identity, ii) of identities" :key="ii">
              <template v-if="identity.type === 'username' && identity.platform === platform">
                <app-member-form-identity-item
                  :identity="identity"
                  :member="props.member"
                  @update="update(ii, $event)"
                  @unmerge="emit('unmerge', $event)"
                  @remove="remove(ii)"
                />
              </template>
            </template>

            <template v-for="(identity, ai) of addIdentities" :key="ai">
              <template v-if="identity.platform === platform">
                <app-member-form-identity-item
                  :identity="identity"
                  :member="props.member"
                  :actions-disabled="true"
                  @update="create(ai, $event)"
                  @clear="addIdentities.splice(ai, 1)"
                />
              </template>
            </template>
          </template>
        </div>
        <p v-if="hasCustomIdentities" class="text-2xs leading-4.5 tracking-1 text-gray-400 font-semibold pb-4">
          CUSTOM PLATFORMS
        </p>
        <div class="flex flex-col gap-3">
          <template v-for="(identity, ii) of identities" :key="ii">
            <template v-if="identity.type === 'username' && !platformsKeys.includes(identity.platform)">
              <app-member-form-identity-item
                :identity="identity"
                :member="props.member"
                :editable="false"
                @update="update(ii, $event)"
                @unmerge="emit('unmerge', $event)"
                @remove="remove(ii)"
              />
            </template>
          </template>
        </div>
      </div>
    </template>
  </app-drawer>
</template>

<script setup lang="ts">
import {
  h,
  computed, onUnmounted, ref,
} from 'vue';
import AppMemberFormIdentityItem from '@/modules/member/components/form/identity/member-form-identity-item.vue';
import { Member, MemberIdentity } from '@/modules/member/types/Member';
import { MemberService } from '@/modules/member/member-service';
import Message from '@/shared/message/message';
import { useStore } from 'vuex';
import { storeToRefs } from 'pinia';
import { useLfSegmentsStore } from '@/modules/lf/segments/store';
import CrDropdown from '@/ui-kit/dropdown/Dropdown.vue';
import CrDropdownItem from '@/ui-kit/dropdown/DropdownItem.vue';
import { CrowdIntegrations } from '@/integrations/integrations-config';
import Errors from '@/shared/error/errors';
import { useMemberStore } from '@/modules/member/store/pinia';
import useProductTracking from '@/shared/modules/monitoring/useProductTracking';
import { EventType, FeatureEventKey } from '@/shared/modules/monitoring/types/event';

const props = withDefaults(defineProps<{
  modelValue?: boolean,
  member: Member
}>(), {
  modelValue: false,
});

const emit = defineEmits(['update:modelValue', 'unmerge']);

const { trackEvent } = useProductTracking();

const store = useStore();
const { selectedProjectGroup } = storeToRefs(useLfSegmentsStore());

const memberStore = useMemberStore();

const drawerModel = computed<boolean>({
  get() {
    return props.modelValue;
  },
  set(value) {
    emit('update:modelValue', value);
  },
});

const identities = ref<MemberIdentity[]>([...(props.member.identities || [])]);
const addIdentities = ref<MemberIdentity[]>([]);

const serverUpdate = () => {
  const segments = props.member.segments.map((s) => s.id);

  trackEvent({
    key: FeatureEventKey.EDIT_CONTRIBUTOR_IDENTITY,
    type: EventType.FEATURE,
    properties: {
      identities: identities.value,
    },
  });

  MemberService.update(props.member.id, {
    identities: identities.value,
  }, segments)
    .then(() => {
      Message.success('Identity successfully updated');
    })
    .catch((error) => {
      if (error.response.status === 409) {
        Message.error(
          h(
            'div',
            {
              class: 'flex flex-col gap-2',
            },
            [
              h(
                'el-button',
                {
                  class: 'btn btn--xs btn--secondary !h-6 !w-fit',
                  onClick: () => {
                    const { memberId, grandParentId } = error.response.data;

                    memberStore.addToMergeMember(memberId, grandParentId);
                    Message.closeAll();
                  },
                },
                'Merge members',
              ),
            ],
          ),
          {
            title: 'Member was not updated because the identity already exists in another member.',
          },
        );
      } else {
        Errors.handle(error);
      }
    });
};

const update = (index: number, data: MemberIdentity) => {
  identities.value[index] = data;
  serverUpdate();
};

const remove = (index: number) => {
  identities.value.splice(index, 1);
  serverUpdate();
};

const create = (index: number, data: MemberIdentity) => {
  identities.value.push(data);
  addIdentities.value.splice(index, 1);
  serverUpdate();
};

const addIdentity = (platform: string) => {
  addIdentities.value.push({
    platform,
    type: 'username',
    value: '',
    verified: true,
    sourceId: null,
  });
};

const platforms = CrowdIntegrations.enabledConfigs;
const platformsKeys = CrowdIntegrations.enabledConfigs.map((p) => p.platform);

const hasCustomIdentities = computed(() => identities.value.some((i) => !platformsKeys.includes(i.platform) && i.type === 'username'));

onUnmounted(() => {
  store.dispatch('member/doFind', {
    id: props.member.id,
    segments: [selectedProjectGroup.value?.id],
  });
});
</script>

<script lang="ts">
export default {
  name: 'AppMemberManageIdentitiesDrawer',
};
</script>

<template>
  <app-drawer
    v-model="drawerModel"
    size="600px"
    title="Edit identities"
    custom-class="identities-drawer"
  >
    <template #content>
      <div class="border-t border-gray-200 -mt-4 -mx-6 px-6">
        <div class="gap-4 flex flex-col pt-6">
          <template v-for="(identity, ii) of identities" :key="ii">
            <template v-if="identity.type === 'username'">
              <app-member-form-identity-item
                :identity="identity"
                :index="ii"
                :member="props.member"
                @update="update(ii, $event)"
              >
                <template #actions>
                  <cr-button
                    :id="`identityRef-${ii}`"
                    :ref="(el) => setActionBtnsRef(el, ii)"
                    type="tertiary-light-gray"
                    size="small"
                    :icon-only="true"
                    class="relative ml-3"
                    @click.prevent.stop="() => onActionBtnClick(ii)"
                  >
                    <i
                      :id="`identityRefIcon-${ii}`"
                      class="ri-more-fill"
                    />
                  </cr-button>
                </template>
              </app-member-form-identity-item>
            </template>
          </template>
        </div>
      </div>
    </template>
  </app-drawer>
  <el-popover
    v-if="identityDropdown !== null"
    placement="bottom-end"
    popper-class="popover-dropdown"
    :virtual-ref="actionBtnRefs[identityDropdown]"
    trigger="click"
    :visible="identityDropdown !== null"
    virtual-triggering
    width="240"
    @update:visible="!$event ? identityDropdown = null : null"
  >
    <div v-click-outside="onClickOutside">
      <app-member-form-identity-dropdown
        :identity="identities[identityDropdown]"
        @update="update(identityDropdown, $event)"
      />
    </div>
  </el-popover>
</template>

<script setup lang="ts">
import {
  computed, onUnmounted, ref,
} from 'vue';
import AppMemberFormIdentityItem from '@/modules/member/components/form/identity/member-form-identity-item.vue';
import { Member, MemberIdentity } from '@/modules/member/types/Member';
import { MemberService } from '@/modules/member/member-service';
import Message from '@/shared/message/message';
import { useStore } from 'vuex';
import { storeToRefs } from 'pinia';
import { useLfSegmentsStore } from '@/modules/lf/segments/store';
import CrButton from '@/ui-kit/button/Button.vue';
import AppSvg from '@/shared/svg/svg.vue';
import AppMemberFormIdentityDropdown from '@/modules/member/components/form/identity/member-form-identity-dropdown.vue';
import { ClickOutside as vClickOutside } from 'element-plus';

const props = withDefaults(defineProps<{
  modelValue?: boolean,
  member: Member
}>(), {
  modelValue: false,
});

const emit = defineEmits(['update:modelValue', 'unmerge']);

const store = useStore();
const { selectedProjectGroup } = storeToRefs(useLfSegmentsStore());

const drawerModel = computed<boolean>({
  get() {
    return props.modelValue;
  },
  set(value) {
    emit('update:modelValue', value);
  },
});

const identities = ref([...(props.member.identities || [])]);

const update = (index: number, data: MemberIdentity) => {
  identities.value[index] = data;
  const segments = props.member.segments.map((s) => s.id);

  MemberService.update(props.member.id, {
    identities: identities.value,
  }, segments)
    .catch((err) => {
      Message.error(err.response.data);
    });
};

const actionBtnRefs = ref<Record<number, any>>({});
const identityDropdown = ref<number | null>(null);

const setActionBtnsRef = (el: any, index: number) => {
  if (el) {
    actionBtnRefs.value[index] = el;
  }
};

const onActionBtnClick = (index: number) => {
  if (identityDropdown.value === index) {
    identityDropdown.value = null;
  } else {
    identityDropdown.value = index;
  }
};

const onClickOutside = (el: any) => {
  if (!el.target?.id.includes('identityRef')) {
    identityDropdown.value = null;
  }
};

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

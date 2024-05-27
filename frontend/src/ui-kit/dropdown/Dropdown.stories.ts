import { ref } from 'vue';
import { dropdownPlacements } from '@/ui-kit/dropdown/types/DropdownPlacement';
import CrDropdown from './Dropdown.vue';
import CrDropdownItem from './DropdownItem.vue';
import CrDropdownSeparator from './DropdownSeparator.vue';
import CrButton from '../button/Button.vue';

export default {
  title: 'Crowd.dev/Dropdown',
  component: CrDropdown,
  tags: ['autodocs'],
  argTypes: {
    placement: {
      description: 'Specifies dropdown placement',
      defaultValue: 'bottom-start',
      control: 'select',
      options: dropdownPlacements,
    },
    width: {
      description: 'Specifies dropdown width',
      defaultValue: 'auto',
      control: 'text',
    },
  },
};

export const Regular = {
  args: {
    placement: 'bottom-start',
    width: 'auto',
  },
  render: (args) => ({
    components: {
      CrDropdown,
      CrDropdownItem,
      CrButton,
      CrDropdownSeparator,
    },
    setup() {
      return { args };
    },
    template: `<div class="p-20"><cr-dropdown :placement="args.placement" :width="args.width">
      <template #trigger>
        <cr-button>Open dropdown</cr-button>
      </template>
      <cr-dropdown-item :disabled="true">
        <i class="ri-link-unlink" />
        Unmerge identity
      </cr-dropdown-item>
      <cr-dropdown-item>
        <i class="ri-verified-badge-line" />
        Verify identity
      </cr-dropdown-item>
      <cr-dropdown-separator />
      <cr-dropdown-item type="danger">
        <i class="ri-delete-bin-6-line" />
        Delete identity
      </cr-dropdown-item>
    </cr-dropdown></div>`,
  }),
};

export const Selected = {
  args: {
  },
  render: () => ({
    components: { CrDropdown, CrDropdownItem, CrButton },
    setup() {
      const selected = ref(1);

      return { selected };
    },
    template: `<cr-dropdown>
      <template #trigger>
        <cr-button>Open dropdown</cr-button>
      </template>
      <cr-dropdown-item @click="selected = 1" :selected="selected === 1">First item</cr-dropdown-item>
      <cr-dropdown-item @click="selected = 2" :selected="selected === 2">Second item</cr-dropdown-item>
      <cr-dropdown-item @click="selected = 3" :selected="selected === 3">Third item</cr-dropdown-item>
    </cr-dropdown>`,
  }),
};

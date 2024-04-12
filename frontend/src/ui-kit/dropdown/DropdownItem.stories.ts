import { dropdownItemTypes } from '@/ui-kit/dropdown/types/DropdownItemType';
import CrDropdownItem from './DropdownItem.vue';

export default {
  title: 'Crowd.dev/DropdownItem',
  component: CrDropdownItem,
  tags: ['autodocs'],
  argTypes: {
    type: {
      description: 'Specifies dropdown item type',
      defaultValue: 'regular',
      control: 'select',
      options: dropdownItemTypes,
    },
    disabled: {
      description: 'Specifies dropdown width',
      defaultValue: 'auto',
      control: 'boolean',
    },
  },
};

export const Regular = {
  args: {
    disabled: false,
    type: 'regular',
  },
  render: (args) => ({
    components: {
      CrDropdownItem,
    },
    setup() {
      return { args };
    },
    template: `<div class="c-dropdown__menu is-open">
      <cr-dropdown-item :disabled="args.disabled" :type="args.type">
        <i class="ri-link-unlink" />
        Dropdown item
      </cr-dropdown-item></div>`,
  }),
};

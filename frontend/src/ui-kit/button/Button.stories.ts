import { buttonTypes } from '@/ui-kit/button/types/ButtonType';
import { buttonSizes } from '@/ui-kit/button/types/ButtonSize';
import { buttonNativeTypes } from '@/ui-kit/button/types/ButtonNativeType';
import CrButton from './Button.vue';

export default {
  title: 'Crowd.dev/Button',
  component: CrButton,
  tags: ['autodocs'],
  argTypes: {
    // Props
    type: {
      description: 'Specifies button type',
      defaultValue: 'primary',
      control: 'select',
      options: buttonTypes,
    },
    size: {
      description: 'Specifies button size',
      defaultValue: 'medium',
      control: 'select',
      options: buttonSizes,
    },
    iconOnly: {
      description: 'If content includes only icon',
      defaultValue: false,
      control: 'boolean',
    },
    loading: {
      description: 'Specifies if button in loading state',
      defaultValue: false,
      control: 'boolean',
    },
    loadingText: {
      description: 'Specifies text displayed in loading state',
      defaultValue: undefined,
      control: 'text',
    },
    disabled: {
      description: 'Specifies if button is disabled',
      defaultValue: false,
      control: 'boolean',
    },
    nativeType: {
      description: 'Specifies button native HTML type',
      defaultValue: 'button',
      control: 'select',
      options: buttonNativeTypes,
    },

    // Slots
    default: {
      description: 'Text or html content of the button',
      control: {
        type: null,
      },
    },
  },
};

export const Primary = {
  label: 'Primary',
  args: {
    type: 'primary',
    size: 'medium',
    nativeType: 'button',
    loading: false,
    loadingText: '',
    disabled: false,
    iconOnly: false,
    default: 'Button text',
  },
};

export const Secondary = {
  args: {
    type: 'secondary',
    size: 'medium',
    nativeType: 'button',
    loading: false,
    loadingText: '',
    disabled: false,
    iconOnly: false,
    default: 'Button text',
  },
};

export const Tertiary = {
  args: {
    type: 'tertiary',
    size: 'medium',
    nativeType: 'button',
    loading: false,
    loadingText: '',
    disabled: false,
    iconOnly: false,
    default: 'Button text',
  },
};

export const TertiaryGray = {
  args: {
    type: 'tertiary-gray',
    size: 'medium',
    nativeType: 'button',
    loading: false,
    loadingText: '',
    disabled: false,
    iconOnly: false,
    default: 'Button text',
  },
};

export const TertiaryLightGray = {
  args: {
    type: 'tertiary-light-gray',
    size: 'medium',
    nativeType: 'button',
    loading: false,
    loadingText: '',
    disabled: false,
    iconOnly: false,
    default: 'Button text',
  },
};

export const Info = {
  args: {
    type: 'info',
    size: 'medium',
    nativeType: 'button',
    loading: false,
    loadingText: '',
    disabled: false,
    iconOnly: false,
    default: 'Button text',
  },
};

export const InfoTransparent = {
  args: {
    type: 'info-transparent',
    size: 'medium',
    nativeType: 'button',
    loading: false,
    loadingText: '',
    disabled: false,
    iconOnly: false,
    default: 'Button text',
  },
};

export const Success = {
  args: {
    type: 'success',
    size: 'medium',
    nativeType: 'button',
    loading: false,
    loadingText: '',
    disabled: false,
    iconOnly: false,
    default: 'Button text',
  },
};

export const SuccessTransparent = {
  args: {
    type: 'success-transparent',
    size: 'medium',
    nativeType: 'button',
    loading: false,
    loadingText: '',
    disabled: false,
    iconOnly: false,
    default: 'Button text',
  },
};

export const Danger = {
  args: {
    type: 'danger',
    size: 'medium',
    nativeType: 'button',
    loading: false,
    loadingText: '',
    disabled: false,
    iconOnly: false,
    default: 'Button text',
  },
};

export const DangerTransparent = {
  args: {
    type: 'danger-transparent',
    size: 'medium',
    nativeType: 'button',
    loading: false,
    loadingText: '',
    disabled: false,
    iconOnly: false,
    default: 'Button text',
  },
};

export const Warning = {
  args: {
    type: 'warning',
    size: 'medium',
    nativeType: 'button',
    loading: false,
    loadingText: '',
    disabled: false,
    iconOnly: false,
    default: 'Button text',
  },
};

export const WarningTransparent = {
  args: {
    type: 'warning-transparent',
    size: 'medium',
    nativeType: 'button',
    loading: false,
    loadingText: '',
    disabled: false,
    iconOnly: false,
    default: 'Button text',
  },
};

export const Feature = {
  args: {
    type: 'feature',
    size: 'medium',
    nativeType: 'button',
    loading: false,
    loadingText: '',
    disabled: false,
    iconOnly: false,
    default: 'Button text',
  },
};

export const FeatureTransparent = {
  args: {
    type: 'feature-transparent',
    size: 'medium',
    nativeType: 'button',
    loading: false,
    loadingText: '',
    disabled: false,
    iconOnly: false,
    default: 'Button text',
  },
};

export const Loading = {
  args: {
    type: 'primary',
    size: 'medium',
    nativeType: 'button',
    loading: true,
    loadingText: 'Loading...',
    disabled: false,
    iconOnly: false,
    default: 'Button text',
  },
};

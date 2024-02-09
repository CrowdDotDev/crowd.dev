import { FieldMessageType } from '@/ui-kit/field-message/types/FieldMessageType';

interface FieldMessageTypeData{
  icon: string
}

export const fieldMessageTypeData: Record<FieldMessageType, FieldMessageTypeData> = {
  error: {
    icon: 'error-warning-line',
  },
  hint: {
    icon: '',
  },
  warning: {
    icon: 'alert-line',
  },
  info: {
    icon: 'information-line',
  },
};

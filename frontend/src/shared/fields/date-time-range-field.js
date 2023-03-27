import * as yup from 'yup';
import moment from 'moment';
import GenericField from '@/shared/fields/generic-field';

function formatDatetime(value) {
  return value
    ? moment(value).format('YYYY-MM-DD HH:mm')
    : null;
}

export default class DateTimeRangeField extends GenericField {
  forFilterInitialValue(value) {
    return value || [];
  }

  forFilterCast() {
    return yup.mixed();
  }

  forFilterPreview(value) {
    if (!value || !value.length) {
      return null;
    }

    const start = value[0];
    const end = value.length === 2 && value[1];

    if (!start && !end) {
      return null;
    }

    if (start && !end) {
      return `> ${formatDatetime(start)}`;
    }

    if (!start && end) {
      return `< ${formatDatetime(end)}`;
    }

    return `${formatDatetime(start)} - ${formatDatetime(
      end,
    )}`;
  }
}

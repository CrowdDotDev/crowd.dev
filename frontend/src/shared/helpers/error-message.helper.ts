import { AxiosError } from 'axios';

export const getAxiosErrorMessage = (
  error: AxiosError,
  defaultMessage: string = 'Something went wrong',
): string => {
  if (error && error.response && error.response.data) {
    const errMsg = error.response.data && typeof error.response.data === 'string'
      ? error.response.data
      : error.message;
    return errMsg;
  }
  return error.message || defaultMessage;
};

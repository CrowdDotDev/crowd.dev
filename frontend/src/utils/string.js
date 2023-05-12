export const withHttp = (url) => (!/^https?:\/\//i.test(url) ? `https://${url}` : url);

export const toSentenceCase = (string) => string.charAt(0).toUpperCase() + string.slice(1);

export const extractRepoNameFromUrl = (url) => {
  const regex = /^https?:\/\/github\.com\/(.+?)\/(.+?)(?:\.git)?$/;
  const match = url.match(regex);

  if (match) {
    return match[2];
  }
  return url;
};

export const isValidUrl = (url) => {
  const urlRegex = /^(?:https?|ftp):\/\/[^\s/$.?#].[^\s]*$/i;

  return urlRegex.test(url);
};

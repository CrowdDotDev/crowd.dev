export const withHttp = (url) => (!/^https?:\/\//i.test(url) ? `https://${url}` : url);

export const toSentenceCase = (string) => string.charAt(0).toUpperCase() + string.slice(1);

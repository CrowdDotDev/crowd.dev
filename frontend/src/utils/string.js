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

export const snakeToSentenceCase = (string) => string.split('_').map((word) => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');

export const truncateText = (text, characters = 200, suffix = '') => {
  if (text.length > characters) {
    return `${text.substring(0, characters)}${suffix}`;
  }
  return text;
};

/** trim and replace multiple/double spaces with a single space
 * '   Emma  Ray   ' ==> 'Emma Ray
 * 'Emma  Ray' ==> 'Emman Ray
*/
export const trimAndReduceSpaces = (str) => str.trim().replace(/\s+/g, ' ');

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

export const getPlatformUrl = ({ platform, username }) => {
  if (platform === 'devto') {
    return `https://dev.to/${username}`;
  } if (platform === 'discord') {
    return `https://discord.com/${username}`;
  } if (platform === 'github') {
    return `https://github.com/${username}`;
  } if (platform === 'slack') {
    return `https://slack.com/${username}`;
  } if (platform === 'twitter') {
    return `https://twitter.com/${username}`;
  } if (platform === 'linkedin' && !username.includes('private-')) {
    return `https://linkedin.com/in/${username}`;
  } if (platform === 'reddit') {
    return `https://reddit.com/user/${username}`;
  } if (platform === 'hackernews') {
    return `https://news.ycombinator.com/user?id=${username}`;
  } if (platform === 'stackoverflow') {
    return `https://stackoverflow.com/users/${username}`;
  }

  return null;
};

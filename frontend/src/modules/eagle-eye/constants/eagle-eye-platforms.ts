const twitterImage = new URL(
  '@/assets/images/integrations/twitter-x-black.png',
  import.meta.url,
).href;

const redditImage = new URL(
  '@/assets/images/integrations/reddit.svg',
  import.meta.url,
).href;

const kaggleImage = new URL(
  '@/assets/images/integrations/kaggle.png',
  import.meta.url,
).href;

const producthuntImage = new URL(
  '@/assets/images/integrations/producthunt.png',
  import.meta.url,
).href;

const hackernewsImage = new URL(
  '@/assets/images/integrations/hackernews.svg',
  import.meta.url,
).href;

export default {
  devto: {
    label: 'DEV',
    img: 'https://cdn-icons-png.flaticon.com/512/5969/5969051.png',
  },
  github: {
    label: 'GitHub',
    img: 'https://cdn-icons-png.flaticon.com/512/25/25231.png',
  },
  hackernews: {
    label: 'Hacker News',
    img: hackernewsImage,
  },
  hashnode: {
    label: 'Hashnode',
    img: 'https://cdn.hashnode.com/res/hashnode/image/upload/v1611902473383/CDyAuTy75.png?auto=compress',
  },
  kaggle: {
    label: 'Kaggle',
    img: kaggleImage,
  },
  medium: {
    label: 'Medium',
    img: 'https://cdn-icons-png.flaticon.com/512/5968/5968885.png',
  },
  producthunt: {
    label: 'Product Hunt',
    img: producthuntImage,
  },
  reddit: {
    label: 'Reddit',
    img: redditImage,
  },
  stackoverflow: {
    label: 'Stack Overflow',
    img: 'https://cdn-icons-png.flaticon.com/512/2111/2111628.png',
  },
  twitter: {
    label: 'X/Twitter',
    img: twitterImage,
  },
  youtube: {
    label: 'YouTube',
    img: 'https://cdn-icons-png.flaticon.com/512/1384/1384060.png',
  },
};

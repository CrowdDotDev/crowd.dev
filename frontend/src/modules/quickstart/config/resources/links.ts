export interface ResourceLink {
  text: string;
  icon: string;
  url: string;
}

export const resourcesLinks: ResourceLink[] = [
  {
    text: 'Watch demo',
    icon: 'ri-film-line',
    url: 'https://www.youtube.com/watch?v=uaKWBvu_k_g',
  },
  {
    text: 'Documentation',
    icon: 'ri-book-open-line',
    url: 'https://docs.crowd.dev',
  },
  {
    text: 'API Reference',
    icon: 'ri-braces-line',
    url: 'https://docs.crowd.dev/reference/readme',
  },
  {
    text: 'Changelog',
    icon: 'ri-megaphone-line',
    url: 'https://changelog.crowd.dev',
  },
  {
    text: 'Discord community',
    icon: 'ri-discord-fill',
    url: 'https://crowd.dev/discord',
  },
];

const getImageUrl = (path: string) => new URL(path, import.meta.url).href;

export const getImageUrlFromPath = (path: string) => getImageUrl(`../assets/images/${path}`);

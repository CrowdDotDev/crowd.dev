export function getImageUrl(name: string, ext: string) {
  const url = new URL(`../assets/${name}.${ext}`, import.meta.url);
  console.log(url);
  return url;
}

export function getImageUrl(name: string, ext: string) {
  const url = new URL(`../assets/images/${name}.${ext}`, import.meta.url);
  console.log(url);
  return url;
}

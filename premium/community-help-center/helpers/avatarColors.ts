const backgroundColors = [
  "#EBECED",
  "#E9E5E3",
  "#FAEBDD",
  "#FBF3DB",
  "#DDEDEA",
  "#DDEBF1",
  "#EAE4F2",
  "#F4DFEB",
  "#FBE4E4",
];
const textColors = [
  "#9B9A97",
  "#64473A",
  "#D9730D",
  "#DFAB01",
  "#0F7B6C",
  "#0B6E99",
  "#6940A5",
  "#AD1A72",
  "#E03E3E",
];

function getColor(name: String, colors: Array<String>) {
  const length = name.length;
  if (length === 0) {
    return undefined;
  }
  const n = name.charCodeAt(0) + name.charCodeAt(1) + length;
  return colors[n % colors.length];
}

export function getBgColor(name) {
  return getColor(name, backgroundColors);
}

export function getTextColor(name) {
  return getColor(name, textColors);
}

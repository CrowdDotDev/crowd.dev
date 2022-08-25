import lodash from "lodash";

function lighterOrDarker(color) {
  const hex = color.replace("#", "");
  const c_r = parseInt(hex.substr(0, 2), 16);
  const c_g = parseInt(hex.substr(2, 2), 16);
  const c_b = parseInt(hex.substr(4, 2), 16);
  const brightness = (c_r * 299 + c_g * 587 + c_b * 114) / 1000;
  return brightness > 100;
}

function hex2(c) {
  c = Math.round(c);
  if (c < 0) c = 0;
  if (c > 255) c = 255;

  var s = c.toString(16);
  if (s.length < 2) s = "0" + s;

  return s;
}

function color(r, g, b) {
  return "#" + hex2(r) + hex2(g) + hex2(b);
}

function getShade(col, light) {
  // TODO: Assert that col is good and that -1 < light < 1

  var r = parseInt(col.substr(1, 2), 16);
  var g = parseInt(col.substr(3, 2), 16);
  var b = parseInt(col.substr(5, 2), 16);

  if (light < 0) {
    r = (1 + light) * r;
    g = (1 + light) * g;
    b = (1 + light) * b;
  } else {
    r = (1 - light) * r + light * 255;
    g = (1 - light) * g + light * 255;
    b = (1 - light) * b + light * 255;
  }

  return color(r, g, b);
}

function getPick(pick, allStyles) {
  let [selector, color, shade, noFlip] = pick.split(":");
  color = allStyles[color];
  if (shade) {
    shade = parseInt(shade);
    if (!lighterOrDarker(color) && !noFlip) {
      shade *= -1;
    }
    shade = shade / 100;
    color = getShade(color, shade);
  }
  return { [selector]: color };
}

export default function (allStyles, picks) {
  if (typeof picks === "string") {
    picks = [picks];
  }
  let filteredPicks = picks.reduce((acc, pick) => {
    let out = { ...acc };
    if (typeof pick === "string") {
      out = { ...out, ...getPick(pick, allStyles) };
    } else if (typeof pick === "object" && pick[0]) {
      out = { ...out, ...getPick(pick[1], allStyles) };
    }

    return out;
  }, {});

  return filteredPicks;
}

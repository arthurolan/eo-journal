const input = document.querySelector("#coordinate-input");
const convertButton = document.querySelector("#convert-button");
const sampleButton = document.querySelector("#sample-button");
const clearButton = document.querySelector("#clear-button");
const appleModeInputs = document.querySelectorAll('input[name="apple-map-mode"]');
const statusEl = document.querySelector("#status");
const notesEl = document.querySelector("#notes");
const resultEls = {
  wgs: document.querySelector("#wgs-result"),
  gcj: document.querySelector("#gcj-result"),
  bd: document.querySelector("#bd-result"),
};
const links = {
  apple: document.querySelector("#apple-link"),
  amap: document.querySelector("#amap-link"),
  baidu: document.querySelector("#baidu-link"),
  google: document.querySelector("#google-link"),
};

let lastResult = null;
let lastParsedText = "";

const PI = Math.PI;
const A = 6378245.0;
const EE = 0.00669342162296594323;
const X_PI = (PI * 3000.0) / 180.0;
const ROUGH_CHINA_BOUNDS = {
  minLon: 72.004,
  maxLon: 137.8347,
  minLat: 0.8293,
  maxLat: 55.8271,
};
const MAINLAND_CONVERSION_POLYGONS = [
  [
    [73.5, 39.4],
    [75.2, 37.7],
    [74.9, 35.4],
    [78.5, 32.5],
    [79.2, 30.0],
    [81.0, 30.2],
    [83.5, 27.5],
    [88.8, 27.8],
    [92.7, 28.0],
    [95.2, 29.0],
    [97.5, 27.8],
    [98.7, 24.0],
    [101.0, 21.5],
    [105.0, 21.0],
    [108.6, 21.5],
    [111.7, 21.0],
    [114.3, 21.8],
    [116.0, 22.8],
    [118.5, 24.0],
    [119.8, 25.5],
    [121.5, 28.5],
    [122.5, 31.0],
    [121.8, 34.5],
    [124.3, 39.8],
    [126.0, 42.0],
    [130.8, 42.7],
    [134.8, 48.4],
    [132.0, 47.7],
    [130.5, 48.9],
    [127.5, 49.6],
    [124.0, 53.5],
    [120.0, 53.3],
    [117.0, 49.7],
    [111.0, 49.3],
    [105.0, 41.8],
    [96.5, 42.8],
    [92.0, 45.0],
    [87.5, 49.1],
    [82.0, 49.0],
    [79.0, 45.0],
    [73.5, 39.4],
  ],
  [
    [108.6, 18.0],
    [111.2, 18.0],
    [111.2, 20.2],
    [108.6, 20.2],
    [108.6, 18.0],
  ],
];

function normalizeText(value) {
  return value
    .replace(/[，。；、]/g, " ")
    .replace(/[：]/g, ":")
    .replace(/[−－]/g, "-")
    .replace(/[Ｅｅ]/g, "E")
    .replace(/[Ｗｗ]/g, "W")
    .replace(/[Ｎｎ]/g, "N")
    .replace(/[Ｓｓ]/g, "S")
    .replace(/东经|经度|经/g, "E")
    .replace(/西经/g, "W")
    .replace(/北纬|纬度|纬/g, "N")
    .replace(/南纬/g, "S")
    .replace(/[º°度]/g, "°")
    .replace(/[′’']/g, "'")
    .replace(/[″”“"]/g, '"')
    .replace(/分/g, "'")
    .replace(/秒/g, '"');
}

function directionToAxis(direction) {
  if (!direction) return null;
  const dir = direction.toUpperCase();
  if (dir === "E" || dir === "W" || dir === "东" || dir === "西") return "lon";
  if (dir === "N" || dir === "S" || dir === "北" || dir === "南") return "lat";
  return null;
}

function applyDirection(value, direction) {
  if (!direction) return value;
  const dir = direction.toUpperCase();
  return dir === "W" || dir === "S" || dir === "西" || dir === "南" ? -Math.abs(value) : Math.abs(value);
}

function dmsToDecimal(degrees, minutes = 0, seconds = 0, direction = "") {
  const sign = Number(degrees) < 0 ? -1 : 1;
  const absolute = Math.abs(Number(degrees)) + Number(minutes || 0) / 60 + Number(seconds || 0) / 3600;
  return applyDirection(sign * absolute, direction);
}

function extractDirectionalValues(text) {
  const values = [];
  const normalized = normalizeText(text);
  const dmsPattern = /([NSEW东西南北])?\s*([+-]?\d{1,3}(?:\.\d+)?)\s*°\s*(?:(\d{1,2}(?:\.\d+)?)\s*')?\s*(?:(\d{1,2}(?:\.\d+)?)\s*")?\s*([NSEW东西南北])?(?!\s*\d)/gi;
  let match;

  while ((match = dmsPattern.exec(normalized))) {
    const direction = match[1] || match[5] || "";
    const axis = directionToAxis(direction);
    values.push({
      axis,
      value: dmsToDecimal(match[2], match[3], match[4], direction),
      source: match[0].trim(),
      kind: "dms",
    });
  }

  const decimalBefore = /([NSEW东西南北])\s*([+-]?\d{1,3}(?:\.\d+)?)/gi;
  while ((match = decimalBefore.exec(normalized))) {
    const direction = match[1];
    values.push({
      axis: directionToAxis(direction),
      value: applyDirection(Number(match[2]), direction),
      source: match[0].trim(),
      kind: "decimal-direction",
    });
  }

  const decimalAfter = /([+-]?\d{1,3}(?:\.\d+)?)\s*([NSEW东西南北])/gi;
  while ((match = decimalAfter.exec(normalized))) {
    const direction = match[2];
    values.push({
      axis: directionToAxis(direction),
      value: applyDirection(Number(match[1]), direction),
      source: match[0].trim(),
      kind: "decimal-direction",
    });
  }

  return dedupeValues(values);
}

function dedupeValues(values) {
  const seen = new Set();
  return values.filter((item) => {
    const key = `${item.axis || "unknown"}:${item.value.toFixed(8)}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function extractPlainNumbers(text) {
  const normalized = normalizeText(text).replace(/([+-]?\d{1,3}(?:\.\d+)?)\s*°\s*(?:(\d{1,2}(?:\.\d+)?)\s*')?\s*(?:(\d{1,2}(?:\.\d+)?)\s*")?/g, " ");
  const matches = normalized.match(/[+-]?\d{1,3}(?:\.\d+)?/g) || [];
  return matches.map(Number).filter(Number.isFinite);
}

function isValidLonLat(lon, lat) {
  return Math.abs(lon) <= 180 && Math.abs(lat) <= 90;
}

function isRoughChina(lon, lat) {
  return lon >= ROUGH_CHINA_BOUNDS.minLon && lon <= ROUGH_CHINA_BOUNDS.maxLon && lat >= ROUGH_CHINA_BOUNDS.minLat && lat <= ROUGH_CHINA_BOUNDS.maxLat;
}

function pointInPolygon(lon, lat, polygon) {
  let inside = false;
  for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
    const [xi, yi] = polygon[i];
    const [xj, yj] = polygon[j];
    const intersects = yi > lat !== yj > lat && lon < ((xj - xi) * (lat - yi)) / (yj - yi) + xi;
    if (intersects) inside = !inside;
  }
  return inside;
}

function isMainlandConversionArea(lon, lat) {
  if (!isRoughChina(lon, lat)) return false;
  return MAINLAND_CONVERSION_POLYGONS.some((polygon) => pointInPolygon(lon, lat, polygon));
}

function scoreCandidate(lon, lat) {
  if (!isValidLonLat(lon, lat)) return -100;
  let score = 0;
  if (isRoughChina(lon, lat)) score += 10;
  if (Math.abs(lon) > Math.abs(lat)) score += 2;
  if (lon >= 70 && lon <= 140) score += 2;
  if (lat >= 3 && lat <= 55) score += 2;
  return score;
}

function parseCoordinate(rawText) {
  const text = rawText.trim();
  if (!text) throw new Error("请输入或粘贴一个坐标。");

  const notes = [];
  const directional = extractDirectionalValues(text);
  const lonItem = directional.find((item) => item.axis === "lon");
  const latItem = directional.find((item) => item.axis === "lat");

  if (lonItem && latItem) {
    const lon = lonItem.value;
    const lat = latItem.value;
    if (!isValidLonLat(lon, lat)) throw new Error("识别到了经纬度方向，但数值超出合法范围。");
    notes.push(`根据方向标记识别：经度 ${lonItem.source}，纬度 ${latItem.source}。`);
    return { lon, lat, notes };
  }

  const dmsValues = directional.filter((item) => item.kind === "dms").map((item) => item.value);
  const plainNumbers = extractPlainNumbers(text);
  const numbers = dmsValues.length >= 2 ? dmsValues : plainNumbers;

  if (numbers.length < 2) {
    throw new Error("没有找到足够的经纬度数字。可以尝试粘贴类似 118.544367, 40.410283 的文本。");
  }

  const first = numbers[0];
  const second = numbers[1];
  const normal = { lon: first, lat: second, reversed: false, score: scoreCandidate(first, second) };
  const reversed = { lon: second, lat: first, reversed: true, score: scoreCandidate(second, first) };
  const chosen = reversed.score > normal.score ? reversed : normal;

  if (chosen.score < 0) throw new Error("前两个数字无法组成合法经纬度。");
  if (chosen.reversed) notes.push("已根据数值范围自动判断：输入更像是“纬度，经度”，已为你调换为“经度，纬度”。");
  else notes.push("已按“经度，纬度”的顺序识别。");

  if (Math.abs(normal.score - reversed.score) <= 1 && normal.score >= 0 && reversed.score >= 0) {
    notes.push("这组数字两个顺序都可能成立，建议人工核对一次。");
  }

  if (numbers.length > 2) notes.push(`文本中还有其他数字，本次使用前两个可组成坐标的数值：${first}，${second}。`);
  return { lon: chosen.lon, lat: chosen.lat, notes };
}

function transformLat(x, y) {
  let ret = -100.0 + 2.0 * x + 3.0 * y + 0.2 * y * y + 0.1 * x * y + 0.2 * Math.sqrt(Math.abs(x));
  ret += ((20.0 * Math.sin(6.0 * x * PI) + 20.0 * Math.sin(2.0 * x * PI)) * 2.0) / 3.0;
  ret += ((20.0 * Math.sin(y * PI) + 40.0 * Math.sin((y / 3.0) * PI)) * 2.0) / 3.0;
  ret += ((160.0 * Math.sin((y / 12.0) * PI) + 320 * Math.sin((y * PI) / 30.0)) * 2.0) / 3.0;
  return ret;
}

function transformLon(x, y) {
  let ret = 300.0 + x + 2.0 * y + 0.1 * x * x + 0.1 * x * y + 0.1 * Math.sqrt(Math.abs(x));
  ret += ((20.0 * Math.sin(6.0 * x * PI) + 20.0 * Math.sin(2.0 * x * PI)) * 2.0) / 3.0;
  ret += ((20.0 * Math.sin(x * PI) + 40.0 * Math.sin((x / 3.0) * PI)) * 2.0) / 3.0;
  ret += ((150.0 * Math.sin((x / 12.0) * PI) + 300.0 * Math.sin((x / 30.0) * PI)) * 2.0) / 3.0;
  return ret;
}

function wgs84ToGcj02(lon, lat) {
  if (!isMainlandConversionArea(lon, lat)) return { lon, lat, shifted: false };
  let dLat = transformLat(lon - 105.0, lat - 35.0);
  let dLon = transformLon(lon - 105.0, lat - 35.0);
  const radLat = (lat / 180.0) * PI;
  let magic = Math.sin(radLat);
  magic = 1 - EE * magic * magic;
  const sqrtMagic = Math.sqrt(magic);
  dLat = (dLat * 180.0) / (((A * (1 - EE)) / (magic * sqrtMagic)) * PI);
  dLon = (dLon * 180.0) / ((A / sqrtMagic) * Math.cos(radLat) * PI);
  return { lon: lon + dLon, lat: lat + dLat, shifted: true };
}

function gcj02ToBd09(lon, lat) {
  const z = Math.sqrt(lon * lon + lat * lat) + 0.00002 * Math.sin(lat * X_PI);
  const theta = Math.atan2(lat, lon) + 0.000003 * Math.cos(lon * X_PI);
  return {
    lon: z * Math.cos(theta) + 0.0065,
    lat: z * Math.sin(theta) + 0.006,
  };
}

function formatCoord(coord) {
  return `${coord.lon.toFixed(8)}, ${coord.lat.toFixed(8)}`;
}

function getAppleMapMode() {
  return document.querySelector('input[name="apple-map-mode"]:checked')?.value || "china";
}

function getAppleMapCoord(wgsCoord, gcjCoord, shifted) {
  return shifted && getAppleMapMode() === "china" ? gcjCoord : wgsCoord;
}

function buildLinks(wgsCoord, appleCoord, mapCoord, baiduCoord) {
  const label = encodeURIComponent("转换坐标");
  const googleQuery = encodeURIComponent(`${mapCoord.lat.toFixed(8)},${mapCoord.lon.toFixed(8)}`);
  return {
    apple: `https://maps.apple.com/?ll=${appleCoord.lat.toFixed(8)},${appleCoord.lon.toFixed(8)}&q=${label}`,
    amap: `https://uri.amap.com/marker?position=${mapCoord.lon.toFixed(8)},${mapCoord.lat.toFixed(8)}&name=${label}&coordinate=gaode`,
    baidu: `https://api.map.baidu.com/marker?location=${baiduCoord.lat.toFixed(8)},${baiduCoord.lon.toFixed(8)}&title=${label}&content=${label}&output=html`,
    google: `https://www.google.com/maps/search/?api=1&query=${googleQuery}`,
  };
}

function setStatus(message, type = "") {
  statusEl.textContent = message;
  statusEl.className = `status ${type}`.trim();
}

function setLinks(urls = null) {
  Object.entries(links).forEach(([key, link]) => {
    if (urls && urls[key]) {
      link.href = urls[key];
      link.dataset.url = urls[key];
      link.classList.remove("disabled");
    } else {
      link.href = "#";
      delete link.dataset.url;
      link.classList.add("disabled");
    }
  });
}

function renderNotes(notes) {
  notesEl.innerHTML = "";
  notes.forEach((note) => {
    const item = document.createElement("li");
    item.textContent = note;
    notesEl.append(item);
  });
}

function resetResults() {
  lastResult = null;
  lastParsedText = "";
  Object.values(resultEls).forEach((el) => {
    el.textContent = "-";
  });
  setLinks();
  renderNotes([]);
}

function convert() {
  try {
    const parsed = parseCoordinate(input.value);
    const wgs = { lon: parsed.lon, lat: parsed.lat };
    const gcjRaw = wgs84ToGcj02(wgs.lon, wgs.lat);
    const gcj = { lon: gcjRaw.lon, lat: gcjRaw.lat };
    const bd = gcjRaw.shifted ? gcj02ToBd09(gcj.lon, gcj.lat) : { ...wgs };
    const apple = getAppleMapCoord(wgs, gcj, gcjRaw.shifted);
    const notes = [...parsed.notes];

    if (gcjRaw.shifted) {
      notes.push("坐标位于中国大陆常用转换范围内，已应用 GCJ-02 偏移算法。");
      if (getAppleMapMode() === "china") {
        notes.push("苹果地图按“中国本地网络”模式使用 GCJ-02；高德和谷歌地图使用 GCJ-02，百度地图使用 BD-09。");
      } else {
        notes.push("苹果地图按“代理/境外网络”模式使用 WGS-84；高德和谷歌地图使用 GCJ-02，百度地图使用 BD-09。");
      }
    } else {
      notes.push("坐标不在中国大陆常用转换范围内，GCJ-02 和 BD-09 均保持与 WGS-84 相同，地图链接直接使用原坐标。");
    }

    lastResult = { wgs, gcj, bd };
    lastParsedText = input.value;
    resultEls.wgs.textContent = formatCoord(wgs);
    resultEls.gcj.textContent = formatCoord(gcj);
    resultEls.bd.textContent = formatCoord(bd);
    setLinks(buildLinks(wgs, apple, gcjRaw.shifted ? gcj : wgs, gcjRaw.shifted ? bd : wgs));
    renderNotes(notes);
    setStatus(gcjRaw.shifted ? "转换完成" : "已识别坐标，但不在大陆转换范围内", gcjRaw.shifted ? "" : "warning");
  } catch (error) {
    resetResults();
    setStatus(error.message, "error");
  }
}

async function copyResult(kind) {
  if (!lastResult || !lastResult[kind]) return;
  const text = formatCoord(lastResult[kind]);
  try {
    await navigator.clipboard.writeText(text);
    setStatus("已复制坐标");
  } catch {
    setStatus(`复制失败，请手动复制：${text}`, "warning");
  }
}

convertButton.addEventListener("click", convert);
input.addEventListener("keydown", (event) => {
  if ((event.metaKey || event.ctrlKey) && event.key === "Enter") convert();
});

sampleButton.addEventListener("click", () => {
  input.value = "N 40°24.617' / E 118°32.662'";
  convert();
});

clearButton.addEventListener("click", () => {
  input.value = "";
  resetResults();
  setStatus("等待输入坐标");
  input.focus();
});

document.querySelectorAll(".copy-button").forEach((button) => {
  button.addEventListener("click", () => copyResult(button.dataset.copy));
});

appleModeInputs.forEach((inputEl) => {
  inputEl.addEventListener("change", () => {
    if (lastResult && lastParsedText === input.value) convert();
  });
});

document.querySelectorAll(".map-button").forEach((link) => {
  link.addEventListener("click", (event) => {
    const url = link.dataset.url;
    if (!url) {
      event.preventDefault();
      setStatus("请先输入坐标并点击“转换”，再打开地图。", "warning");
      return;
    }

    event.preventDefault();
    window.open(url, "_blank", "noopener,noreferrer");
  });
});

resetResults();

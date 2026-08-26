/**
 * Canadian city -> province lookup used by the location picker to reconcile
 * a typed city against the selected province (e.g. "Calgary" + "Saskatchewan"
 * should become Alberta). This is a curated heuristic for the MVP: known
 * cities resolve precisely, unknown cities fall through so the user's choice
 * is never blocked.
 *
 * Keys are normalized: lowercase, periods removed, whitespace collapsed.
 * E.g. "St. John's" -> "st johns" (Newfoundland and Labrador) and
 * "Saint John" -> "saint john" (New Brunswick) stay distinct.
 */

const CITY_PROVINCE = {
  // Alberta
  calgary: "Alberta",
  edmonton: "Alberta",
  "red deer": "Alberta",
  lethbridge: "Alberta",
  "medicine hat": "Alberta",
  "grande prairie": "Alberta",
  banff: "Alberta",
  canmore: "Alberta",
  airdrie: "Alberta",
  "st albert": "Alberta",
  "fort mcmurray": "Alberta",
  "sherwood park": "Alberta",
  leduc: "Alberta",
  "spruce grove": "Alberta",
  brooks: "Alberta",
  camrose: "Alberta",
  "cold lake": "Alberta",
  okotoks: "Alberta",
  "high river": "Alberta",
  wetaskiwin: "Alberta",

  // British Columbia
  vancouver: "British Columbia",
  victoria: "British Columbia",
  kelowna: "British Columbia",
  kamloops: "British Columbia",
  nanaimo: "British Columbia",
  abbotsford: "British Columbia",
  surrey: "British Columbia",
  burnaby: "British Columbia",
  richmond: "British Columbia",
  coquitlam: "British Columbia",
  langley: "British Columbia",
  "prince george": "British Columbia",
  penticton: "British Columbia",
  whistler: "British Columbia",
  chilliwack: "British Columbia",
  "maple ridge": "British Columbia",
  "new westminster": "British Columbia",
  "north vancouver": "British Columbia",
  "west vancouver": "British Columbia",
  "port coquitlam": "British Columbia",
  vernon: "British Columbia",
  cranbrook: "British Columbia",
  "salmon arm": "British Columbia",
  duncan: "British Columbia",
  courtenay: "British Columbia",
  "campbell river": "British Columbia",
  terrace: "British Columbia",
  "fort st john": "British Columbia",

  // Manitoba
  winnipeg: "Manitoba",
  brandon: "Manitoba",
  steinbach: "Manitoba",
  thompson: "Manitoba",
  "portage la prairie": "Manitoba",
  winkler: "Manitoba",
  selkirk: "Manitoba",
  dauphin: "Manitoba",

  // New Brunswick
  fredericton: "New Brunswick",
  moncton: "New Brunswick",
  "saint john": "New Brunswick",
  miramichi: "New Brunswick",
  dieppe: "New Brunswick",
  edmundston: "New Brunswick",
  bathurst: "New Brunswick",
  campbellton: "New Brunswick",
  oromocto: "New Brunswick",

  // Newfoundland and Labrador
  "st johns": "Newfoundland and Labrador",
  "corner brook": "Newfoundland and Labrador",
  "mount pearl": "Newfoundland and Labrador",
  gander: "Newfoundland and Labrador",
  "grand falls windsor": "Newfoundland and Labrador",
  "labrador city": "Newfoundland and Labrador",

  // Nova Scotia
  halifax: "Nova Scotia",
  dartmouth: "Nova Scotia",
  sydney: "Nova Scotia",
  truro: "Nova Scotia",
  "new glasgow": "Nova Scotia",
  bedford: "Nova Scotia",
  amherst: "Nova Scotia",
  yarmouth: "Nova Scotia",
  kentville: "Nova Scotia",
  bridgewater: "Nova Scotia",

  // Ontario
  toronto: "Ontario",
  ottawa: "Ontario",
  mississauga: "Ontario",
  brampton: "Ontario",
  hamilton: "Ontario",
  london: "Ontario",
  kitchener: "Ontario",
  waterloo: "Ontario",
  guelph: "Ontario",
  windsor: "Ontario",
  barrie: "Ontario",
  oshawa: "Ontario",
  kingston: "Ontario",
  "thunder bay": "Ontario",
  sudbury: "Ontario",
  "st catharines": "Ontario",
  "niagara falls": "Ontario",
  vaughan: "Ontario",
  markham: "Ontario",
  "richmond hill": "Ontario",
  burlington: "Ontario",
  oakville: "Ontario",
  peterborough: "Ontario",
  "sault ste marie": "Ontario",
  "north bay": "Ontario",
  timmins: "Ontario",
  belleville: "Ontario",
  cornwall: "Ontario",
  brantford: "Ontario",
  cambridge: "Ontario",
  welland: "Ontario",
  whitby: "Ontario",
  ajax: "Ontario",
  pickering: "Ontario",
  milton: "Ontario",
  newmarket: "Ontario",
  aurora: "Ontario",

  // Prince Edward Island
  charlottetown: "Prince Edward Island",
  summerside: "Prince Edward Island",
  stratford: "Prince Edward Island",

  // Quebec
  montreal: "Quebec",
  "quebec city": "Quebec",
  quebec: "Quebec",
  laval: "Quebec",
  gatineau: "Quebec",
  longueuil: "Quebec",
  sherbrooke: "Quebec",
  "trois rivieres": "Quebec",
  saguenay: "Quebec",
  levis: "Quebec",
  drummondville: "Quebec",
  "saint jean sur richelieu": "Quebec",
  terrebonne: "Quebec",
  "saint jerome": "Quebec",
  granby: "Quebec",
  blainville: "Quebec",
  repentigny: "Quebec",
  boucherville: "Quebec",
  "saint hyacinthe": "Quebec",

  // Saskatchewan
  regina: "Saskatchewan",
  saskatoon: "Saskatchewan",
  "prince albert": "Saskatchewan",
  "moose jaw": "Saskatchewan",
  "swift current": "Saskatchewan",
  yorkton: "Saskatchewan",
  estevan: "Saskatchewan",
  "north battleford": "Saskatchewan",
  weyburn: "Saskatchewan",
};

const normalize = (city) =>
  String(city || "")
    .trim()
    .toLowerCase()
    .replace(/\./g, "")
    .replace(/['’]/g, "")
    .replace(/\s+/g, " ");

/**
 * Resolve a typed city to its province, or null when unknown.
 * @param {string} city
 * @returns {string|null}
 */
export const cityProvinceOf = (city) => CITY_PROVINCE[normalize(city)] || null;

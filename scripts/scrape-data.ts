/**
 * One-time data scraper for Forza Motorsport (2023) cars and tracks.
 * Sources: forza.fandom.com wiki (MediaWiki API)
 *
 * Run: npx ts-node --project tsconfig.scripts.json scripts/scrape-data.ts
 */

import * as fs from "fs";
import * as path from "path";

const WIKI_API = "https://forza.fandom.com/api.php";
const HEADERS = { "User-Agent": "ForzaDice-DataBot/1.0 (private use)" };

function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

async function fetchWikitext(page: string): Promise<string> {
  const url = `${WIKI_API}?action=parse&page=${encodeURIComponent(page)}&prop=wikitext&format=json`;
  const res = await fetch(url, { headers: HEADERS });
  const data = (await res.json()) as { parse?: { wikitext?: { "*": string } } };
  return data?.parse?.wikitext?.["*"] ?? "";
}

function decodeDrivetrain(code: string): "AWD" | "FWD" | "RWD" | null {
  const c = code.toLowerCase().trim();
  const last = c[c.length - 1];
  if (last === "a" || c === "4wd") return "AWD";
  if (last === "f") return "FWD";
  if (last === "r") return "RWD";
  return null;
}

function piToClass(pi: number): string {
  if (pi < 300) return "E";
  if (pi < 400) return "D";
  if (pi < 500) return "C";
  if (pi < 600) return "B";
  if (pi < 700) return "A";
  if (pi < 800) return "S1";
  if (pi < 900) return "S2";
  return "X";
}

function slugify(str: string): string {
  return str
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

// Returns { pageTitle, displayName } from [[PageTitle|Display]] or [[Title]]
function parseWikiLink(raw: string): { pageTitle: string; displayName: string } {
  const m = raw.match(/\[\[([^\]]+)\]\]/);
  if (!m) {
    const t = raw.trim();
    return { pageTitle: t, displayName: t };
  }
  const inner = m[1];
  const pipe = inner.indexOf("|");
  if (pipe >= 0) {
    return {
      pageTitle: inner.slice(0, pipe).trim(),
      displayName: inner.slice(pipe + 1).trim(),
    };
  }
  return { pageTitle: inner.trim(), displayName: inner.trim() };
}

// ─────────────────────────────────────────────────────────────────────────────
// Cars
// ─────────────────────────────────────────────────────────────────────────────

interface CarRow {
  id: string;
  name: string;
  manufacturer: string;
  year: number;
  pi: number;
  class: string;
  drivetrain: string;
  thumbnailUrl: string;
}

interface CarIntermediate extends CarRow {
  _wikiPageTitle: string;
}

function parseCarsWikitext(wikitext: string): CarIntermediate[] {
  const cars: CarIntermediate[] = [];
  const re = /\{\{CarListStatsFM23\|([^}]+)\}\}/g;
  let m: RegExpExecArray | null;

  while ((m = re.exec(wikitext)) !== null) {
    const raw = m[1];

    // Split by | while respecting nested [[ ]]
    const parts: string[] = [];
    let depth = 0;
    let buf = "";
    for (const ch of raw) {
      if (ch === "[") depth++;
      else if (ch === "]") depth--;
      if (ch === "|" && depth === 0) {
        parts.push(buf);
        buf = "";
      } else {
        buf += ch;
      }
    }
    parts.push(buf);

    // Template: _ | year | [[WikiTitle|Display]] | country | drivetrain | PI | ...
    if (parts.length < 6) continue;

    const yearStr = parts[1].trim();
    const nameRaw = parts[2].trim();
    const driveRaw = parts[4].trim();
    const piRaw = parts[5].trim();

    const year = parseInt(yearStr, 10);
    if (isNaN(year)) continue;

    const pi = parseInt(piRaw, 10);
    if (isNaN(pi) || pi < 100 || pi > 999) continue;

    const drivetrain = decodeDrivetrain(driveRaw);
    if (!drivetrain) continue;

    const { pageTitle, displayName } = parseWikiLink(nameRaw);
    const name = displayName || pageTitle;
    if (!name) continue;

    // Manufacturer = everything before the year in the display name
    const yearInName = name.indexOf(String(year));
    const manufacturer =
      yearInName > 0 ? name.slice(0, yearInName).trim() : name.split(" ")[0];

    cars.push({
      id: slugify(`${name}-${year}`),
      name,
      manufacturer: manufacturer || "Unknown",
      year,
      pi,
      class: piToClass(pi),
      drivetrain,
      thumbnailUrl: "",
      _wikiPageTitle: pageTitle,
    });
  }

  return cars;
}

// Batch-fetch thumbnails via MediaWiki pageimages API
// Returns Map<canonical title → thumbnail URL>
async function fetchThumbnails(
  titles: string[]
): Promise<Map<string, string>> {
  const thumbs = new Map<string, string>();
  const BATCH = 50;

  for (let i = 0; i < titles.length; i += BATCH) {
    const batch = titles.slice(i, i + BATCH);
    // Encode each title individually; join with literal | (not encoded)
    const titlesParam = batch.map(encodeURIComponent).join("|");
    const url =
      `${WIKI_API}?action=query&titles=${titlesParam}` +
      `&prop=pageimages&pithumbsize=400&pilimit=${BATCH}&format=json`;

    try {
      const res = await fetch(url, { headers: HEADERS });
      const data = (await res.json()) as {
        query?: {
          normalized?: { from: string; to: string }[];
          pages?: Record<
            string,
            { title: string; thumbnail?: { source: string } }
          >;
        };
      };

      // Build normalisation map (from → to)
      const normMap = new Map<string, string>();
      for (const n of data?.query?.normalized ?? []) {
        normMap.set(n.from, n.to);
      }

      for (const page of Object.values(data?.query?.pages ?? {})) {
        if (page.thumbnail?.source) {
          // Store under canonical title
          thumbs.set(page.title, page.thumbnail.source);
          // Also under un-normalised original titles that map here
          for (const [from, to] of normMap) {
            if (to === page.title) thumbs.set(from, page.thumbnail.source);
          }
        }
      }
    } catch (e) {
      console.warn(`  Thumbnail batch ${i}–${i + BATCH} error:`, e);
    }

    await sleep(250);
    if (i % 250 === 0 && i > 0) {
      console.log(`  Thumbnails: ${i}/${titles.length}`);
    }
  }
  return thumbs;
}

// ─────────────────────────────────────────────────────────────────────────────
// Tracks — curated FM23 list
// ─────────────────────────────────────────────────────────────────────────────

interface TrackRow {
  id: string;
  name: string;
  configuration: string;
  thumbnailUrl: string;
}

const FM23_TRACKS: { page: string; display: string }[] = [
  { page: "Brands_Hatch", display: "Brands Hatch" },
  { page: "Circuit_de_Barcelona-Catalunya", display: "Circuit de Barcelona-Catalunya" },
  { page: "Circuit_de_Spa-Francorchamps", display: "Circuit de Spa-Francorchamps" },
  { page: "Daytona_International_Speedway", display: "Daytona International Speedway" },
  { page: "Eaglerock_Speedway", display: "Eaglerock Speedway" },
  { page: "Fujimi_Kaido", display: "Fujimi Kaido" },
  { page: "Grand_Oak_Raceway", display: "Grand Oak Raceway" },
  { page: "Hakone_Circuit", display: "Hakone Circuit" },
  { page: "Hockenheimring", display: "Hockenheimring" },
  { page: "Homestead-Miami_Speedway", display: "Homestead-Miami Speedway" },
  { page: "Indianapolis_Motor_Speedway", display: "Indianapolis Motor Speedway" },
  { page: "Kyalami_Grand_Prix_Circuit", display: "Kyalami Grand Prix Circuit" },
  { page: "Le_Mans_Circuit_de_la_Sarthe", display: "Le Mans - Circuit International de la Sarthe" },
  { page: "Lime_Rock_Park", display: "Lime Rock Park" },
  { page: "Michelin_Raceway_Road_Atlanta", display: "Michelin Raceway Road Atlanta" },
  { page: "Mid-Ohio_Sports_Car_Course", display: "Mid-Ohio Sports Car Course" },
  { page: "Maple_Valley_Raceway", display: "Maple Valley Raceway" },
  { page: "Mount_Panorama_Circuit", display: "Mount Panorama Circuit" },
  { page: "Mugello_Autodromo_Internazionale", display: "Mugello Circuit" },
  { page: "Nürburgring", display: "Nürburgring" },
  { page: "Road_America", display: "Road America" },
  { page: "Sebring_International_Raceway", display: "Sebring International Raceway" },
  { page: "Silverstone_Racing_Circuit", display: "Silverstone Circuit" },
  { page: "Sunset_Peninsula_Raceway", display: "Sunset Peninsula Raceway" },
  { page: "Suzuka_Circuit", display: "Suzuka Circuit" },
  { page: "Virginia_International_Raceway", display: "Virginia International Raceway" },
  { page: "Watkins_Glen_International", display: "Watkins Glen International" },
  { page: "WeatherTech_Raceway_Laguna_Seca", display: "WeatherTech Raceway Laguna Seca" },
  { page: "Yas_Marina_Circuit", display: "Yas Marina Circuit" },
];

function parseTrackLayouts(wikitext: string): string[] {
  const layouts: string[] = [];
  const re = /\|layout\d*\s*=\s*([^\n|{}]+)/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(wikitext)) !== null) {
    const layout = m[1].trim();
    if (layout && layout.length < 80) layouts.push(layout);
  }
  return layouts.length > 0 ? layouts : ["Circuit"];
}

function extractGalleryImage(wikitext: string): string {
  const fm23Match = wikitext.match(/FM23[^\n]*?\.(jpg|jpeg|png)/i);
  if (fm23Match) return fm23Match[0].trim();
  const anyMatch = wikitext.match(/(FM\d+[^\n]*?\.(jpg|jpeg|png))/i);
  if (anyMatch) return anyMatch[1].trim();
  return "";
}

async function fetchFileUrl(filename: string): Promise<string> {
  if (!filename) return "";
  const url =
    `${WIKI_API}?action=query&titles=File:${encodeURIComponent(filename)}` +
    `&prop=imageinfo&iiprop=url&format=json`;
  try {
    const res = await fetch(url, { headers: HEADERS });
    const data = (await res.json()) as {
      query?: { pages?: Record<string, { imageinfo?: { url: string }[] }> };
    };
    const pages = Object.values(data?.query?.pages ?? {});
    return pages[0]?.imageinfo?.[0]?.url ?? "";
  } catch {
    return "";
  }
}

async function scrapeTracks(): Promise<TrackRow[]> {
  const tracks: TrackRow[] = [];
  for (const trackDef of FM23_TRACKS) {
    process.stdout.write(`  ${trackDef.display}... `);
    try {
      const wikitext = await fetchWikitext(trackDef.page);
      const layouts = parseTrackLayouts(wikitext);
      const imageFilename = extractGalleryImage(wikitext);
      const thumbnailUrl = await fetchFileUrl(imageFilename);

      for (const layout of layouts) {
        tracks.push({
          id: slugify(`${trackDef.display}-${layout}`),
          name: trackDef.display,
          configuration: layout,
          thumbnailUrl,
        });
      }
      console.log(`${layouts.length} layout(s), thumb=${!!thumbnailUrl}`);
    } catch (e) {
      console.log(`FAILED`);
      console.warn("  Error:", e);
      tracks.push({
        id: slugify(trackDef.display),
        name: trackDef.display,
        configuration: "Circuit",
        thumbnailUrl: "",
      });
    }
    await sleep(300);
  }
  return tracks;
}

// ─────────────────────────────────────────────────────────────────────────────
// Main
// ─────────────────────────────────────────────────────────────────────────────

async function main() {
  console.log("=== ForzaDice Data Scraper ===\n");

  // 1. Cars wikitext
  console.log("Fetching car list...");
  const carsWikitext = await fetchWikitext("Forza_Motorsport_(2023)/Cars");
  let cars = parseCarsWikitext(carsWikitext);
  console.log(`Parsed ${cars.length} car entries`);

  // Deduplicate
  const seen = new Set<string>();
  cars = cars.filter((c) => {
    if (seen.has(c.id)) return false;
    seen.add(c.id);
    return true;
  });
  console.log(`${cars.length} unique cars`);

  // 2. Car thumbnails
  console.log("\nFetching car thumbnails...");
  const wikiTitles = cars.map((c) => c._wikiPageTitle);
  const thumbMap = await fetchThumbnails(wikiTitles);
  console.log(`Got ${thumbMap.size} thumbnails`);

  // Match thumbnails: try page title first, then display name
  cars = cars.map((c) => {
    const thumb =
      thumbMap.get(c._wikiPageTitle) ??
      thumbMap.get(c._wikiPageTitle.replace(/_/g, " ")) ??
      thumbMap.get(c.name) ??
      "";
    return { ...c, thumbnailUrl: thumb };
  });

  const withThumbs = cars.filter((c) => c.thumbnailUrl).length;
  console.log(`${withThumbs}/${cars.length} cars have thumbnails`);

  // Strip internal field before saving
  const carsOut = cars.map(({ _wikiPageTitle: _skip, ...rest }) => rest);

  // 3. Tracks
  console.log("\nFetching tracks...");
  const tracks = await scrapeTracks();
  console.log(`\n${tracks.length} track configurations total`);

  // 4. Write
  const outDir = path.join(__dirname, "..", "data");
  fs.mkdirSync(outDir, { recursive: true });
  fs.writeFileSync(path.join(outDir, "cars.json"), JSON.stringify(carsOut, null, 2));
  fs.writeFileSync(path.join(outDir, "tracks.json"), JSON.stringify(tracks, null, 2));

  console.log("\n✓ data/cars.json and data/tracks.json written");
  console.log(`  Cars: ${carsOut.length}`);
  console.log(`  Track configs: ${tracks.length}`);
}

main().catch((e) => {
  console.error("Scrape failed:", e);
  process.exit(1);
});

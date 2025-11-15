#!/usr/bin/env node

/**
 * Analyzes SVG logo visual weights and calculates scale factors
 * to achieve similar visual weights across all team logos.
 *
 * This script:
 * 1. Downloads team logo SVGs from NHL assets (caches in tools/logo-analysis/logos)
 * 2. Renders each SVG to analyze visual weight (filled area percentage)
 * 3. Calculates scale factors to normalize visual weights
 * 4. Outputs CSS and JSON configuration
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import https from 'https';
import sharp from 'sharp';
import * as convexHullModule from 'monotone-chain-convex-hull';

// monotone-chain-convex-hull doesn't have an exports field in its package.json, so some trickery
// is needed to make its import and the related type correct with Node's ESM behavior.

// monotoneChainConvexHull(points: [number, number][], options?: Record<string, any>): [number, number][]
type MonotoneChainConvexHullFn = (
  points: [number, number][],
  options?: { sorted?: boolean },
) => [number, number][];

//@ts-expect-error - default property does not exist on the module
// eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
const monotoneChainConvexHull: MonotoneChainConvexHullFn = convexHullModule.default.default;

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// All NHL team abbreviations
const NHL_TEAMS: readonly string[] = [
  'ANA',
  'ARI',
  'BOS',
  'BUF',
  'CGY',
  'CAR',
  'CHI',
  'COL',
  'CBJ',
  'DAL',
  'DET',
  'EDM',
  'FLA',
  'LAK',
  'MIN',
  'MTL',
  'NSH',
  'NJD',
  'NYI',
  'NYR',
  'OTT',
  'PHI',
  'PIT',
  'SJS',
  'SEA',
  'STL',
  'TBL',
  'TOR',
  'UTA',
  'VAN',
  'VGK',
  'WSH',
  'WPG',
];

const LOGO_BASE_URL = 'https://assets.nhle.com/logos/nhl/svg';
const OUTPUT_DIR = path.join(__dirname, 'logo-analysis');
const TARGET_SIZE = 200; // Size to render SVG for analysis (pixels)
const LOGOS_DIR = path.join(OUTPUT_DIR, 'logos');

type AnalysisSuccess = {
  team: string;
  visualWeight: number;
  filledPixels: number;
  totalPixels: number;
  width: number;
  height: number;
};

type AnalysisError = {
  team: string;
  visualWeight: null;
  error: string;
};

type Analysis = AnalysisSuccess | AnalysisError;

type ScaleResult = {
  team: string;
  scale: number;
  visualWeight: number | null;
  targetWeight?: number;
  scaledWeight?: number;
  error?: string;
};

/**
 * Download SVG from URL
 */
function downloadSVG(url: string): Promise<string> {
  return new Promise((resolve, reject) => {
    https
      .get(url, (res) => {
        if (res.statusCode !== 200) {
          reject(new Error(`Failed to download ${url}: ${res.statusCode}`));
          return;
        }
        let data = '';
        res.setEncoding('utf8');
        res.on('data', (chunk: string) => {
          data += chunk;
        });
        res.on('end', () => resolve(data));
      })
      .on('error', reject);
  });
}

/**
 * Get SVG content from cache or download and cache it
 */
async function getOrFetchSVG(team: string): Promise<string> {
  const fileName = `${team}_dark.svg`;
  const filePath = path.join(LOGOS_DIR, fileName);
  if (fs.existsSync(filePath)) {
    console.log(`Using cached SVG for ${team}`);
    return fs.readFileSync(filePath, 'utf8');
  }

  const url = `${LOGO_BASE_URL}/${fileName}`;
  console.log(`Downloading SVG for ${team}...`);
  const svgContent = await downloadSVG(url);
  fs.writeFileSync(filePath, svgContent, 'utf8');
  return svgContent;
}

/**
 * Calculate visual weight of an SVG by rendering it and analyzing filled pixels
 */
async function calculateVisualWeight(svgContent: string, team: string): Promise<Analysis> {
  try {
    // Render SVG to PNG with sharp
    const buffer = await sharp(Buffer.from(svgContent))
      .resize(TARGET_SIZE, TARGET_SIZE, {
        fit: 'contain',
        background: { r: 255, g: 255, b: 255, alpha: 0 }, // Transparent background
      })
      .png()
      .toBuffer();

    // Get image metadata and raw pixel data
    const { data, info } = await sharp(buffer)
      .ensureAlpha()
      .raw()
      .toBuffer({ resolveWithObject: true });

    // Collect all non-transparent pixel coordinates
    let filledPixels = 0;
    const totalPixels = info.width * info.height;
    const points: [number, number][] = [];
    for (let y = 0; y < info.height; y++) {
      for (let x = 0; x < info.width; x++) {
        const idx = (y * info.width + x) * 4;
        const alpha = data[idx + 3];
        if (alpha > 10) {
          filledPixels++;
          points.push([x, y]);
        }
      }
    }

    // Early exit if no points found
    if (points.length < 3) {
      return {
        team,
        visualWeight: null,
        error: 'Insufficient filled pixels for hull',
      };
    }

    // Compute convex hull (array of indices into "points")
    const hullIndices = monotoneChainConvexHull(points); // e.g., [[x, y], ...]
    const hullPoints = hullIndices.map(([x, y]) => [x, y] as [number, number]);

    // Shoelace formula for area
    function polygonArea(pts: [number, number][]): number {
      let a = 0;
      for (let i = 0; i < pts.length; i++) {
        const [x1, y1] = pts[i];
        const [x2, y2] = pts[(i + 1) % pts.length];
        a += x1 * y2 - x2 * y1;
      }
      return Math.abs(a) / 2;
    }
    const hullArea = polygonArea(hullPoints);
    const visualWeight = hullArea / totalPixels;

    return {
      team,
      visualWeight, // Use hull area as new weight
      filledPixels,
      totalPixels,
      width: info.width,
      height: info.height,
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error(`Error analyzing ${team}:`, message);
    return {
      team,
      visualWeight: null,
      error: message,
    };
  }
}

/**
 * Calculate scale factors to normalize visual weights
 */
function calculateScaleFactors(analyses: Analysis[]): ScaleResult[] {
  const validAnalyses = analyses.filter(
    (a): a is AnalysisSuccess => a.visualWeight !== null && a.visualWeight > 0,
  );

  if (validAnalyses.length === 0) {
    throw new Error('No valid analyses to calculate scale factors');
  }

  // Calculate geometric mean of visual weights as target
  const logSum = validAnalyses.reduce((sum, a) => sum + Math.log(a.visualWeight), 0);
  const geometricMean = Math.exp(logSum / validAnalyses.length);
  const targetWeight = geometricMean;

  console.log(`\nTarget visual weight (geometric mean): ${(targetWeight * 100).toFixed(2)}%`);

  // Calculate scale factor for each logo
  // Scale factor = sqrt(targetWeight / currentWeight)
  // Using square root because area scales with square of dimension
  const scales: ScaleResult[] = analyses.map((analysis) => {
    if (analysis.visualWeight === null || analysis.visualWeight === 0) {
      return {
        team: analysis.team,
        scale: 1.0,
        visualWeight: analysis.visualWeight,
        error: 'Invalid visual weight',
      };
    }

    const scale = Math.sqrt(targetWeight / analysis.visualWeight);
    return {
      team: analysis.team,
      scale: scale,
      visualWeight: analysis.visualWeight,
      targetWeight: targetWeight,
      scaledWeight: analysis.visualWeight * (scale * scale),
    };
  });

  return scales;
}

/**
 * Main function
 */
async function main(): Promise<void> {
  console.log('Analyzing NHL team logo visual weights...\n');

  // Create output directory
  if (!fs.existsSync(OUTPUT_DIR)) {
    fs.mkdirSync(OUTPUT_DIR, { recursive: true });
  }
  if (!fs.existsSync(LOGOS_DIR)) {
    fs.mkdirSync(LOGOS_DIR, { recursive: true });
  }

  // Download and analyze each logo
  const analyses: Analysis[] = [];
  for (const team of NHL_TEAMS) {
    console.log(`Analyzing ${team}...`);

    try {
      const svgContent = await getOrFetchSVG(team);
      const analysis = await calculateVisualWeight(svgContent, team);
      analyses.push(analysis);

      const weightPercent = analysis.visualWeight
        ? (analysis.visualWeight * 100).toFixed(2)
        : 'ERROR';
      console.log(`  Visual weight: ${weightPercent}%`);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      console.error(`  Error: ${message}`);
      analyses.push({
        team,
        visualWeight: null,
        error: message,
      });
    }
  }

  // Calculate scale factors
  console.log('\nCalculating scale factors...');
  const scales = calculateScaleFactors(analyses);

  // Sort by scale factor for easier review
  scales.sort((a, b) => (b.scale || 0) - (a.scale || 0));

  // Output results
  console.log('\n=== Scale Factors ===');
  scales.forEach(({ team, scale, visualWeight }) => {
    if (visualWeight !== null) {
      const weightPercent = (visualWeight * 100).toFixed(2);
      console.log(`${team}: ${scale.toFixed(3)}x (weight: ${weightPercent}%)`);
    } else {
      console.log(`${team}: ERROR - ${scale === 1.0 ? 'using default' : ''}`);
    }
  });

  // Save JSON results
  const jsonPath = path.join(OUTPUT_DIR, 'logo-scales.json');
  fs.writeFileSync(jsonPath, JSON.stringify(scales, null, 2), 'utf8');
  console.log(`\nSaved JSON results to: ${jsonPath}`);

  // Generate SCSS with BEM naming (nested syntax)
  const scssLines = scales
    .filter(({ scale }) => scale !== 1.0)
    .map(
      ({ team, scale }) => `  &--${team} {
    transform: scale(${scale.toFixed(3)});
  }`,
    )
    .join('\n\n');

  const scssHeader =
    "/* DON'T EDIT THIS FILE. It is automatically generated by analyze-logo-weights.ts */\n" +
    '/* stylelint-disable-next-line selector-class-pattern */\n';

  const scssContent =
    scssHeader +
    (scssLines.length > 0
      ? `.team-logo__image {\n${scssLines}\n}`
      : '/* No scale adjustments needed - all logos have similar visual weights */') +
    '\n';

  const scssPath = path.join(OUTPUT_DIR, 'logo-scales.scss');
  fs.writeFileSync(scssPath, scssContent, 'utf8');
  console.log(`Saved SCSS to: ${scssPath}`);

  console.log('\n=== Analysis Complete ===');
  console.log('\nNext steps:');
  console.log('1. Review the scale factors in logo-scales.json if interested');
  console.log('2. The app team-logo-scales.scss file should be automatically up to date');
  console.log('3. Visit http://localhost:8008/nhl-recap/gallery/team-logos to see the logos');
  console.log('4. Adjust if needed by modifying the app team-logo.scss file');
}

main().catch(console.error);

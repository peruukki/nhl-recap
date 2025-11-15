# Logo visual weight analysis tool

This tool analyzes NHL team logo SVGs to calculate their visual weights and generates scale factors to achieve consistent visual weights across all logos.

## Overview

Sports team logos have different shapes and visual densities, which makes them appear to have different visual weights even when displayed at the same pixel size. This tool:

1. **Downloads** all NHL team logo SVGs from the official NHL assets
2. **Renders** each SVG to analyze its visual weight (filled area percentage)
3. **Calculates** scale factors to normalize visual weights
4. **Generates** CSS/SCSS with scale transforms for easy integration

## Usage

Run the analysis script:

```bash
npm run scale-team-logos
```

Or directly:

```bash
node tools/analyze-logo-weights.js
```

## Output

The tool generates three output files in `tools/logo-analysis/`:

1. **`logo-scales.json`** - JSON data with all analysis results and scale factors
2. **`logo-scales.css`** - CSS with scale transforms (for reference)
3. **`logo-scales.scss`** - SCSS with BEM naming convention (ready to use)

## How it works

### Visual weight calculation

1. Each SVG is downloaded and rendered to a fixed-size raster image (200x200px)
2. The tool collects all non-transparent pixel coordinates
3. A convex hull is computed around all non-transparent pixels (using Andrew's Monotone Chain algorithm)
4. The area of the convex hull is calculated using the shoelace formula
5. Visual weight = convex hull area / total pixels

This approach provides better perceptual balance than simply counting filled pixels, as it accounts for the overall visual footprint of the logo, including transparent areas within or on the edges of the logo shape.

### Scale factor calculation

1. Calculate the geometric mean of all visual weights as the target
2. For each logo: `scale = sqrt(targetWeight / currentWeight)`
3. Using square root because area scales with the square of dimension

### Integration

The generated SCSS can be integrated into your `team-logo.scss` file. Simply copy the content from `logo-scales.scss` and add it to your `.team-logo__image` block:

```scss
.team-logo__image {
  // ... existing styles (width, height, positioning) ...

  // Add scale transforms from logo-scales.scss
  &--ANA {
    transform: scale(1.123);
  }
  &--BOS {
    transform: scale(0.987);
  }
  // ... etc
}
```

**Note on transform-origin**: By default, `transform: scale()` scales from the center. If you need to adjust the scaling origin (e.g., to maintain alignment with left/right positioning), you can add `transform-origin`:

```scss
&--HOME_TEAM {
  transform-origin: left center;
  transform: scale(1.123);
}

&--AWAY_TEAM {
  transform-origin: right center;
  transform: scale(1.123);
}
```

You may also need to adjust the existing horizontal/vertical offsets after applying scales, as scaling can affect perceived positioning.

## Customization

You can modify the script to:

- Change the target visual weight (`TARGET_VISUAL_WEIGHT`)
- Adjust the analysis size (`TARGET_SIZE`)
- Use different scaling algorithms
- Filter out specific teams

## Notes

- The tool uses the geometric mean to determine the target visual weight, which is more robust than arithmetic mean for ratios
- Scale factors are calculated to normalize visual weights, not to match a fixed target
- Some logos may require manual adjustment after automated scaling
- The analysis downloads SVGs from the NHL assets server, so an internet connection is required

## Troubleshooting

If you encounter errors:

1. **Network issues**: Check your internet connection and that NHL assets are accessible
2. **Sharp installation**: Make sure `sharp` is properly installed (may require native dependencies)
3. **Team abbreviations**: Verify that all team abbreviations in `NHL_TEAMS` are correct
4. **SVG format**: Some SVGs may have unusual formats that require special handling

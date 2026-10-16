# One Figure, Every Canvas

Project page for **One Figure, Every Canvas: Editable Flowchart Relayout via
Agentic Pipeline**.

This is a static HTML/CSS/JavaScript website. No package installation, build
step, backend, or environment variables are required.

## Deploy to Vercel

1. Push this repository, including `static/`, to GitHub.
2. In Vercel, select **Add New > Project** and import the repository.
3. Keep **Root Directory** at the repository root (`.`).
4. Use **Other** as the Framework Preset. `vercel.json` sets the Output
   Directory to `.`, and leaves the Build and Install Commands empty.
   Remove any conflicting project-level overrides from an earlier setup.
5. Select **Deploy** and check the generated preview URL.

Subsequent pushes to the connected production branch redeploy the website.
The production branch is configured in the Vercel project settings.

Official documentation:
[static build settings](https://vercel.com/docs/builds/configure-a-build),
[vercel.json](https://vercel.com/docs/project-configuration/vercel-json), and
[deployment exclusions](https://vercel.com/docs/deployments/vercel-ignore).

### Optional CLI Deployment

From the repository root, run:

```sh
npx vercel
```

This creates a preview deployment and prompts you to sign in and link a project.
Once the preview is checked, publish with:

```sh
npx vercel --prod
```

The local `.vercel/` project association is ignored by Git. Do not commit
credentials or access tokens.

## Before Publishing

- Confirm that the arXiv, Code, and Data links in `index.html` are up to date.
- Confirm that `static/pdfs/paper.pdf` is the intended public paper version.
- Check all result images, carousel arrows, baseline selectors, and style sliders.
- Keep filename capitalization exact: Vercel paths are case-sensitive.
- Add absolute social-preview and citation URLs in the HTML metadata once the
  final public domain is known.
- Everything in `static/` is public after deployment. Review its contents before
  publishing; no asset files are excluded by the current configuration.

## Project Files

| Path | Purpose |
| --- | --- |
| `index.html` | Title, authors, links, paper text, and section structure |
| `static/css/index.css` | Layout and responsive styles |
| `static/css/theme.css` | Shared visual design across all sections |
| `static/css/method.css` | Method stage presentation styles |
| `static/js/index.js` | Result data, carousels, comparisons, and research tables |
| `static/js/method.js` | Independent Method stage playback and fixed captions |
| `static/js/method-ppt.js` | Generated PPT artwork and original rich feedback |
| `static/images/` | Teasers, method figure, results, ablations, and style transfer |
| `static/pdfs/paper.pdf` | Public paper PDF |
| `vercel.json` | Static deployment configuration |
| `.vercelignore` | Excludes local configuration and non-site files from uploads |

## Local Preview

Open `index.html` in your browser. A development server is not required.
The static layout is also compatible with GitHub Pages; `.nojekyll` is retained
for that purpose.

## Animated Method

The Method section has four independently selected tabs: **Overview, (a) Parse Stage,
(b) Style Stage, and (c) Layout Stage**. The Overview builds in approximately four seconds.
Each stage stops on its complete figure and stays selected until the visitor
chooses another tab. Completed stages remain fully visible when revisited.
Parse, Style, and Layout each finish in approximately five seconds. Style's
Original, Parsed, Iteration 1, and Iteration 2 diagrams share a single row.
Iteration labels sit above their figures as column headings. Critic feedback
uses the site's typography and grouped check/suggestion sections, preserving
all source wording, numbered items, and formulas.
Feedback sits in a shared row below the figures: two wide columns for Parse
and Layout, and one compact row for Style. Red and magenta text keep the exact
colors of their corresponding PPT annotations, including inherited paragraph
colors. The teaser retains its original grouping contour around the outputs.
Each stage has one fixed caption; there is no bottom timeline or Replay control.
The Play/Pause button can pause or restart the selected stage.
Previous/Next controls and the connected stage tabs provide manual navigation.
Selected Parse, Style, and Layout tabs use the exact light blue, orange, and
green fills from the Overview, with matching colored progress lines.

The Method player has one lavender-edged outer frame, with a divider and a
separate warm-white caption area below the animation. Individual Method figures
have no added CSS borders, shadows, or card backgrounds. Showcase images in the
teaser, results, ablations, and style transfer use a 1px black canvas outline;
the style comparison slider has one outline around its shared canvas. The original
colored PPT annotations are preserved within the artwork. Shared styling uses
indigo and lavender details on warm white, with readable ink colors. Lavender
color fields stay within the header, using light lavender and visible animated
flowchart details. The teaser and body sections share warm white. Background
gradients always span the full width.
Routed heading marks, short node trails, connected contribution bullets, and
paragraph rules distinguish sections without colored bands or picture cards.
The four hero links share a lavender base and turn deep purple on hover or
keyboard focus. Data tables use a raised lavender-edged frame. Faint flowchart
routes in the page margins animate small data signals; reduced-motion
preferences keep these decorations static.
Headings use locally hosted Space Grotesk; body text uses Manrope. Both fonts
include their SIL Open Font License in `static/fonts/`. Result galleries have
one light outer frame around the whole region, retaining their existing grids
and individual black canvas outlines. Gallery navigation dots sit inside each
frame. All gallery frames align to the same content width as the tables and
Method player, including Style Transfer.

Playback pauses when the section leaves the viewport or the browser tab is
hidden. On phones, the figures scroll horizontally and follow the current
iteration during playback. Reduced-motion preferences show complete, paused
figures; pressing Play explicitly opts into the sequence.

`static/js/method.js` contains timings and captions. Original rich text, math,
images, enlarged regions, and every colored annotation are extracted from the
PPTs into `static/js/method-ppt.js` and `static/images/method/ppt/`. The generator
checks that all 27 Parse, 15 Style, and 22 Layout colored annotations are retained.
Overview connectors are individual complete PPT shapes, appearing with their
destination stage. No PowerPoint or external player is needed by the website.
To regenerate the assets, install Pillow and run:

```sh
python scripts/build-method-ppt.py --source-dir PATH_TO_PPTS
```

The source directory must contain `overview.pptx`, `parse-stage.pptx`,
`style-stage.pptx`, and `layout-stage (1).pptx`.

## Acknowledgments

Based on the
[Academic Project Page Template](https://github.com/eliahuhorwitz/Academic-project-page-template).
Parts of the original template were adopted from [Nerfies](https://nerfies.github.io/).

## Website License

The website template is licensed under
[Creative Commons Attribution-ShareAlike 4.0](https://creativecommons.org/licenses/by-sa/4.0/).

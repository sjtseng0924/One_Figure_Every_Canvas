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
| `static/js/index.js` | Result data, carousels, comparisons, and research tables |
| `static/images/` | Teasers, method figure, results, ablations, and style transfer |
| `static/pdfs/paper.pdf` | Public paper PDF |
| `vercel.json` | Static deployment configuration |
| `.vercelignore` | Excludes local configuration and non-site files from uploads |

## Local Preview

Open `index.html` in your browser. A development server is not required.
The static layout is also compatible with GitHub Pages; `.nojekyll` is retained
for that purpose.

## Acknowledgments

Based on the
[Academic Project Page Template](https://github.com/eliahuhorwitz/Academic-project-page-template).
Parts of the original template were adopted from [Nerfies](https://nerfies.github.io/).

## Website License

The website template is licensed under
[Creative Commons Attribution-ShareAlike 4.0](https://creativecommons.org/licenses/by-sa/4.0/).

# WOTR Player — GitHub Pages edition

A static Old Time Radio player with show search, genre browsing, 30-second rewind/forward, sleep timers, continuous playback, Surprise Me, and failed-stream recovery.

## Publish using GitHub Desktop (recommended)

1. Extract this ZIP into a folder.
2. In GitHub Desktop, create a new repository named `wotr-player` on your computer.
3. Open that repository's local folder. Copy the extracted files and the `episodes` folder into it. `index.html` must be directly at the repository root, not inside another folder.
4. Include the empty `.nojekyll` file. On macOS press Command+Shift+Period in Finder to show hidden files if needed. Alternatively create `.nojekyll` using GitHub's Add file → Create new file after publishing the repository.
5. In GitHub Desktop, commit the files, then click Publish repository. For GitHub Free Pages hosting, uncheck Keep this code private. This publishes the source publicly.
6. On GitHub.com open the repository → Settings → Pages.
7. Under Build and deployment choose Deploy from a branch, select `main` and `/ (root)`, then Save.
8. Wait for the Pages deployment to complete. Settings → Pages will show the actual site URL, typically https://YOUR-USERNAME.github.io/wotr-player/.

GitHub Desktop is useful here because this app includes hundreds of episode catalog files. Keep the folder structure intact. Do not upload the ZIP itself as the website.

## Privacy

Normal GitHub Pages publication makes the website public. The existing ChatGPT-hosted app's private access gate is not part of this export. This package has not published anything or changed your existing app.

## Files

- index.html: application page
- style.css: responsive dark theme
- app.js: playback and interaction logic
- catalog.json: show catalog
- episodes/: one JSON catalog per show
- radio-logo.png: cathedral-radio logo and favicon
- .nojekyll: disables Jekyll processing

No build step, API key, backend, or npm installation is required. Audio files are streamed from Internet Archive and are not bundled. Only episode catalogs referenced by the current app are included.

## Local preview

Opening index.html directly as a local file can prevent catalog loading. To preview with Python installed, run `python3 -m http.server 8000` from the extracted folder, then visit http://localhost:8000/.

## Check after publishing

Verify show/genre browsing, Show search, an episode stream, scrubber and skip controls, mobile layout, and sleep timer selection. Audio availability depends on Internet Archive. Full physical-device and locked-screen behavior has not been verified.

Selections are stored in the browser per website origin; your saved selection from the previous address will not transfer automatically. Playback position is not saved.

## Catalog snapshot

301 shows; 31,703 recordings. Includes the specified source replacements:
- Fibber McGee and Molly: 1,255 recordings from https://archive.org/details/fibber-mc-gee-and-molly
- Suspense: 911 recordings from https://archive.org/details/OTRR_Suspense_Singles
- Bell Telephone Hour: 10 recordings from https://archive.org/details/Bell_Telephone_Hour

The broader starting collection is https://archive.org/details/lumedwards.
The separate OTRR/pCloud source was investigated but is not integrated.

## Future updates

Commit changed application or catalog files and push to `main`; Pages will republish. Updates to your ChatGPT-hosted copy do not automatically sync to this repository.

GitHub documentation:
https://docs.github.com/en/pages/getting-started-with-github-pages/configuring-a-publishing-source-for-your-github-pages-site
https://docs.github.com/en/pages/getting-started-with-github-pages/creating-a-github-pages-site

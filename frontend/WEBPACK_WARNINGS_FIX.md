# Webpack Warnings Fix

How to suppress `source-map-loader` warnings produced by `@vladmandic/face-api`.

---

## The Problem

When running `npm start` or `npm run build`, you may see warnings like:

```
WARNING in ./node_modules/@vladmandic/face-api/dist/face-api.esm.js
Module Warning (from ./node_modules/source-map-loader/dist/cjs.js):
Failed to parse source map from '...' file: Error: ENOENT: no such file or directory
```

These come from `source-map-loader` trying to load source maps for the face-api.js library, which does not ship with complete source maps.

The warnings are harmless — the app still works — but they pollute the build output.

---

## The Fix — CRACO

The project uses **CRACO** (Create React App Configuration Override) to modify the CRA webpack config without ejecting.

### 1. Install CRACO

Already installed as a dependency:

```bash
npm install @craco/craco
```

### 2. Update package.json scripts

Already configured:

```json
{
  "scripts": {
    "start": "craco start",
    "build": "craco build",
    "test": "craco test"
  }
}
```

### 3. craco.config.js

Location: `frontend/craco.config.js`

```js
const { getLoader, loaderByName } = require("@craco/craco");

module.exports = {
  webpack: {
    configure: (webpackConfig) => {
      const { isFound, match } = getLoader(
        webpackConfig,
        loaderByName("source-map-loader")
      );
      if (isFound) {
        const exclude = match.loader.exclude || [];
        match.loader.exclude = Array.isArray(exclude)
          ? [...exclude, /node_modules\/@vladmandic/]
          : [exclude, /node_modules\/@vladmandic/];
      }
      return webpackConfig;
    },
  },
};
```

This adds `node_modules/@vladmandic` to the `source-map-loader` exclusion list, which suppresses the warnings for face-api.js.

---

## Alternative: GENERATE_SOURCEMAP=false

For production builds, you can also disable source maps entirely:

```env
GENERATE_SOURCEMAP=false
```

Add to `frontend/.env` or prefix the build command:

```bash
GENERATE_SOURCEMAP=false npm run build
```

This reduces build size and eliminates all source-map warnings, but removes source maps for debugging.

---

## CRACO Version Compatibility

| React Scripts | CRACO Version |
|---|---|
| 5.x (CRA 5) | @craco/craco 7.x |
| 4.x (CRA 4) | @craco/craco 6.x |

This project uses CRA 5 + CRACO 7.1.

---

## Verifying the Fix

After applying the config, run:

```bash
npm start
```

The `Failed to parse source map` warnings should no longer appear in the terminal output.

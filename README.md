# DOVISTA EPD Generator — local full generator prototype

This local app is a dependency-light EPD generator prototype for windows and doors.

It is structured around:
- PCR 2019:14 VERSION 2.0.1
- EF 3.1-oriented factor fields
- active lifecycle modules A1, A2, A3, B4, C1, C2, C3, C4, D
- multi-product switching and import
- BOM import and factor mapping
- factor-library import with custom overrides
- scenario import for lifecycle modules
- export-ready calculation packages
- local persistence in the browser

## Run locally

Serve the folder with any static file server. Example:

```bash
python -m http.server 8000
```

Open:

```text
http://localhost:8000
```

## What changed in this version

The calculation engine now returns a structured calculation package containing:
- methodology config
- product metadata
- module results
- stage totals
- factor usage
- assumptions log
- validation issues

Saved calculation snapshots are stored in browser localStorage.

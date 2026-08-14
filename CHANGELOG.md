# Changelog

## 0.1.1

- Fixed YouTube discovery to use the YouTube Data API `videos.list` `mostPopular` chart for the selected region.
- Added client-side filtering for the Published Within and Minimum Views controls.
- Simplified YouTube retrieval to a single API call that includes snippet and statistics data.

## 0.1.0

- Initial public release candidate.
- Added Trend Radar node for Google Trends RSS and YouTube Data API trend discovery.
- Added deterministic 0-100 trend scoring.
- Added YouTube API key credential.
- Added GitHub Actions npm publishing workflow with provenance support.

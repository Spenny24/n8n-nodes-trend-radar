# n8n-nodes-trend-radar

Trend Radar is an n8n community node for discovering, normalising, and scoring trend records from Google Trends RSS and the YouTube Data API.

It returns structured items for downstream n8n nodes, including OpenAI, Anthropic, Gemini, Airtable, Google Sheets, databases, or publishing workflows. The node does not call any AI model and the trend score is deterministic.

## Features

- Google Trends RSS ingestion, with no credential required
- YouTube Data API v3 video discovery using an API key credential
- Region filtering with two-letter region codes such as `GB` or `US`
- YouTube minimum view and published-within filters
- Normalised output across sources
- Deterministic 0-100 `trendScore`
- Sort by trend score, recency, or popularity
- No runtime npm dependencies

## Installation

Install from n8n after the package is published and approved for your n8n environment:

```bash
n8n-nodes-trend-radar
```

For self-hosted n8n instances that allow manually installed community nodes, install the package from npm once published:

```bash
npm install n8n-nodes-trend-radar
```

Restart n8n after installation if your deployment does not reload community packages automatically.

## Credentials

Google Trends does not require credentials.

For YouTube:

1. Open Google Cloud Console.
2. Enable **YouTube Data API v3** for your project.
3. Create an API key.
4. In n8n, create a **YouTube Data API** credential.
5. Paste the API key into the credential.

The API key is stored in n8n credentials. Do not paste API keys into node parameters.

## Node Parameters

| Parameter | Description |
| --- | --- |
| Source | `Google Trends`, `YouTube`, or `Both` |
| Region | Two-letter region code used by the selected source |
| Maximum Results | Maximum number of returned items, from 1 to 50 |
| Published Within | YouTube-only filter for videos published within this many hours |
| Minimum Views | YouTube-only minimum view count |
| Sort By | `Trend Score`, `Most Recent`, or `Popularity` |

## Example Output

```json
{
  "title": "Example trend",
  "source": "youtube",
  "url": "https://www.youtube.com/watch?v=...",
  "publishedAt": "2026-08-13T10:00:00.000Z",
  "views": 2400000,
  "trendScore": 87,
  "region": "GB"
}
```

Google Trends items use `source: "google_trends"` and may include `searchVolume` instead of `views`.

## Trend Score

`trendScore` is deterministic and bounded from 0 to 100.

The score combines:

- Recency, weighted at 55%. A newly published item scores highest and decays linearly over seven days.
- Popularity, weighted at 45%. Views or search volume are scored logarithmically so a single viral item does not flatten the ranking.

The formula is implemented in `utils/trendScoring.ts` and covered by unit tests.

## Development

```bash
npm install
npm run lint
npm test
npm run build
npm run scan
```

Run a local n8n instance with the node loaded:

```bash
npm run dev
```

## Submission Notes

This package is prepared for n8n Creator Portal submission using the current n8n node tooling.

The publish workflow in `.github/workflows/publish.yml` publishes from GitHub Actions with npm provenance, as required for Creator Portal verification from May 1, 2026.

Before publishing, configure npm Trusted Publishing for:

- Repository owner: `Spenny24`
- Repository name: `n8n-nodes-trend-radar`
- Workflow name: `publish.yml`

## License

MIT

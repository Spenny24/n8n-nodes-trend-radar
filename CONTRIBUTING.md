# Contributing

Thanks for helping improve Trend Radar.

## Development

Run the full local check before opening a pull request:

```bash
npm install
npm run lint
npm test
npm run build
npm run scan
```

Keep changes small and focused. Do not add runtime dependencies unless n8n verification requirements allow them and there is no practical built-in alternative.

## Secrets

Do not commit API keys, npm tokens, credentials, exported n8n credential data, or private workflow data.

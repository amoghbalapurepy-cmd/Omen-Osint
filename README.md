# OMEN — Real Public Web OSINT Console

OMEN is a local, browser-based OSINT tool that checks public signals from the open web. It combines:

- a live public web mention search
- provider-specific public account checks for common platforms
- a lightweight UI to review results in a single console

This project is designed to run locally from a Node.js server and does not require a database or external service beyond the configured search provider API.

## What this project does

The app supports two main flows:

1. Public web mention search
   - Enter a name, phrase, keyword, username, or handle
   - The backend sends each query to Tavily
   - Results are streamed back as real provider-indexed URLs, titles, and snippets

2. Public profile verification
   - Enter a username and the app checks public profile endpoints for:
     - GitHub
     - GitLab
     - Bluesky
     - Keybase
     - Reddit
     - npm maintainer evidence

## Project structure

```text
OMEN-REAL-OSINT/
├── index.html
├── server.js
├── README.md
├── index.bak.html
├── server.brave-backup.js
└── package.json (if present in your environment)
```

## Requirements

- Node.js 18+ (20+ recommended)
- Internet access for live searches and public API checks
- A Tavily API key

## Setup

1. Open a terminal in the project folder.
2. Set your environment variable:

### Windows PowerShell
```powershell
$env:TAVILY_API_KEY="YOUR_TAVILY_API_KEY"
node server.js
```

### Windows CMD
```cmd
set TAVILY_API_KEY=YOUR_TAVILY_API_KEY
node server.js
```

### Linux/macOS
```bash
export TAVILY_API_KEY="YOUR_TAVILY_API_KEY"
node server.js
```

3. Open the app in your browser:

```text
http://localhost:8787
```

## API behavior

The backend exposes a few local endpoints:

- GET /api/health
  - returns service status
- GET /api/websearch?q=...
  - runs the Tavily-powered public web search
- GET /api/recon?username=...
  - checks public usernames against configured providers

## Search workflow

The search logic automatically generates multiple query variations to reduce blind spots, including:

- exact phrase search
- raw input search
- handle-form variants such as @username
- punctuation-normalized variants when appropriate

This is meant to widen coverage without claiming that a result proves identity or ownership.

## Accuracy boundaries

This tool is intentionally evidence-first and conservative.

- A returned URL means the search provider indexed that page for the submitted query
- It does not prove the page is still live
- It does not prove the account belongs to a specific person
- It does not prove two profiles or mentions are the same identity

Public web search and public profile APIs are limited by provider indexing, rate limits, and access rules.

## Privacy and scope

This project is limited to:

- public web content
- public API responses
- local, user-driven research

It does not:

- log in to accounts
- bypass private access controls
- scrape behind authentication walls
- infer identity matches beyond the displayed evidence

## Notes

The frontend is served by the local Node server, and the live search is powered by the Tavily API. The code in this repo expects the API key to be defined in the same terminal session that starts the server.

## Example use cases

- Search whether a phrase or brand name appears in public web content
- Check whether a username appears on public platforms
- Review multiple provider results side by side
- Investigate public mentions with a stronger evidence trail

## License and usage

Use this project for authorized, lawful, and ethical research only. As with any OSINT tooling, confirm your local legal and organizational requirements before using it against any target or data source.


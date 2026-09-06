# OMEN

### Personal Exposure & Network Security Console

**OMEN** is a local-first, browser-based security and OSINT console designed to help users investigate **publicly available information** and perform defensive security checks from a single interface.

It combines live public-web search, public username verification, network diagnostics, and several defensive security utilities in one lightweight Node.js application.

> **Evidence first. No fabricated profiles. No private-account access. No identity guessing.**

---

## Overview

OMEN was built around a simple idea:

**If information is publicly exposed, make it easier to find, inspect, and understand — without pretending that search results prove more than they actually do.**

The project currently provides two major investigation paths:

* **Public Web OSINT** — search indexed public pages for names, phrases, usernames, handles, keywords, and other identifiers.
* **Public Profile Verification** — check selected public platform endpoints for username presence.

It also includes defensive utilities for areas such as network connectivity, DNS/email configuration, URL safety, TLS/SSL information, and password exposure checks.

---

## Features

### 🔎 Public Web OSINT

OMEN can send live searches to Tavily and stream the returned results directly into the console.

The search system:

* Accepts names, usernames, handles, phrases, and keywords
* Generates multiple search variants
* Performs real provider-backed searches
* Returns real indexed URLs
* Displays titles and snippets
* Removes duplicate URLs
* Streams results as they arrive
* Shows the number of results discovered

Example inputs:

```text
plague.programmer
Example name
"example phrase"
example_username
```

OMEN does **not** generate fake profile URLs or fabricate search results.

---

### 👤 Public Profile Verification

OMEN can check selected public endpoints for username presence across:

* GitHub
* GitLab
* Bluesky
* Keybase
* Reddit
* npm maintainer evidence

These checks are intended to answer:

> "Does this public endpoint currently provide evidence for this username?"

They are **not** intended to answer:

> "Does this account definitely belong to this person?"

---

### 🌐 Network & Endpoint Diagnostics

The console also provides defensive network utilities, including:

* Endpoint reachability
* Latency checks
* DNS information
* Network-device checks
* Connectivity diagnostics

---

### 🛡️ Defensive Security Checks

OMEN includes utilities for inspecting security-related configuration and exposure, including:

* DNS configuration
* Email security configuration
* SPF / DMARC checks
* URL safety checks
* SSL/TLS information
* Certificate information
* Password exposure checks

The project is designed so that sensitive credentials are not sent to the frontend as part of normal operation.

---

## How Public Web Search Works

OMEN's public-web search is powered by **Tavily**.

A search input is expanded into several query variations to reduce obvious blind spots.

For example:

```text
plague.programmer
```

may produce variations such as:

```text
"plague.programmer"
plague.programmer
"plague programmer"
@plague.programmer
```

The backend sends these searches to Tavily and streams the returned results to the browser.

OMEN then:

1. Receives the provider response
2. Extracts the returned public URLs
3. Removes duplicate URLs
4. Displays the available metadata
5. Reports the final number of unique URLs

### Important

OMEN searches **public pages returned by the configured search provider**.

It does **not** crawl the entire internet.

Search coverage depends on:

* Search-engine indexing
* Provider availability
* Query formulation
* Rate limits
* Website accessibility
* Pages being publicly indexed

---

## Accuracy & Evidence Model

OMEN deliberately avoids treating a search result as proof of identity.

A returned result means:

> The configured search provider returned a publicly indexed page for the submitted query.

It does **not** automatically mean:

* The page belongs to the person being investigated
* The username belongs to that person
* Two accounts belong to the same person
* A mention is current
* A profile is authentic
* The person controls the account
* The search result represents every occurrence on the internet

This distinction is fundamental to OMEN.

### Evidence ≠ Identity

OMEN displays evidence.

**The user is responsible for interpreting that evidence.**

---

## Privacy & Scope

OMEN is designed around public, user-initiated research.

It does not:

* Log into third-party accounts
* Bypass authentication
* Access private accounts
* Circumvent access controls
* Attempt to defeat security mechanisms
* Claim identity matches without evidence
* Generate fabricated OSINT results

The project is intended for lawful and authorized research, defensive security work, privacy awareness, and investigation of information that is legitimately available to the user.

---

## Architecture

```text
┌───────────────────────────────┐
│          OMEN UI              │
│       Browser Interface       │
└───────────────┬───────────────┘
                │
                ▼
┌───────────────────────────────┐
│       Local Node.js Server    │
│                               │
│  • Search orchestration       │
│  • Result streaming           │
│  • Public endpoint checks     │
│  • Security utilities         │
└───────┬───────────┬───────────┘
        │           │
        ▼           ▼
   ┌─────────┐  ┌────────────────┐
   │ Tavily  │  │ Public network │
   │ Search  │  │ / security APIs│
   └─────────┘  └────────────────┘
```

The browser communicates with the local Node.js backend.

API credentials such as the Tavily key are kept server-side through environment variables rather than embedded in the frontend.

---

## Requirements

### Software

* Node.js **18+**
* Internet connection
* A Tavily API key

Node.js 20+ is recommended.

---

## Installation

Clone the repository:

```bash
git clone https://github.com/amoghbalapurepy-cmd/Omen-Osint.git
cd Omen-Osint
```

Install dependencies if the project contains any:

```bash
npm install
```

---

## Configuration

OMEN expects the Tavily API key to be available as an environment variable.

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

### Linux / macOS

```bash
export TAVILY_API_KEY="YOUR_TAVILY_API_KEY"
node server.js
```

Then open:

```text
http://localhost:8787
```

### Never commit your real API key

Your real Tavily key should remain local.

Use `.env.example` as a template if environment-file support is added.

---

## API Endpoints

OMEN currently exposes local endpoints through its Node.js backend.

### Health

```text
GET /api/health
```

Returns the current backend status.

### Public Web Search

```text
GET /api/websearch?q=<query>
```

Runs the Tavily-powered public-web search and streams newline-delimited results.

### Public Username Recon

```text
GET /api/recon?username=<username>
```

Checks configured public platform endpoints for username evidence.

---

## Project Structure

```text
Omen-Osint/
│
├── index.html
├── server.js
│
├── README.md
├── LICENSE
├── SECURITY.md
│
├── .env.example
├── .gitignore
├── package.json
│
└── assets/
    └── screenshots/
```

Only files that actually exist in the repository should be included in this structure.

---

## Security Considerations

OMEN itself should be treated as security-sensitive software.

When running or modifying the project:

* Never commit API keys
* Never place secrets in frontend JavaScript
* Keep dependencies updated
* Validate user input
* Use request timeouts
* Avoid logging credentials
* Avoid storing sensitive search data unnecessarily
* Review third-party API terms before deployment
* Prefer running the application locally unless remote deployment is intentionally secured

For reporting vulnerabilities, see [`SECURITY.md`](SECURITY.md).

---

## Responsible Use

OMEN is intended for:

* Defensive security research
* Privacy awareness
* Public-information research
* Authorized investigations
* Security testing of systems you are permitted to test
* Educational purposes

Do not use OMEN to:

* Bypass authentication
* Access private information
* Circumvent security controls
* Harass or target individuals
* Impersonate other people
* Collect information for malicious purposes

Always follow applicable laws, policies, and the terms of the services being queried.

---

## Roadmap

OMEN is still under active development.

Planned improvements include:

* [ ] Better OSINT result categorization
* [ ] Evidence confidence indicators
* [ ] Search/exposure timeline
* [ ] Scan history
* [ ] Scan comparison
* [ ] Domain security scanner
* [ ] HTTP security-header analyzer
* [ ] Public document exposure search
* [ ] Image exposure search
* [ ] GitHub public-repository exposure checks
* [ ] Evidence export
* [ ] Automated investigation reports
* [ ] PDF report generation
* [ ] Improved result filtering
* [ ] Additional public-data providers

The goal is to improve **coverage and evidence quality**, not to make unsupported identity claims.

---

## Design Principles

OMEN follows a few core principles:

### 1. Real results over guesses

If OMEN cannot verify a result, it should not invent one.

### 2. Evidence over assumptions

A URL is evidence of a search result — not automatic proof of identity.

### 3. Public data only

The project focuses on information legitimately available through public sources.

### 4. Local-first operation

The application can run locally without requiring a hosted OMEN backend.

### 5. Security by default

Secrets should remain server-side, and the project should minimize unnecessary data collection.

---

## License

OMEN is released under the **MIT License**.

See [`LICENSE`](LICENSE) for the full license text.

---

## Author

Created and maintained by **Amogh Balapure**.

If you find a bug, have an improvement idea, or want to contribute, open an issue or pull request on the repository.

---

## Disclaimer

OMEN is a research and defensive-security tool.

Search results and public profile information can be incomplete, outdated, inaccurate, or incorrectly associated with a search term.

**Always independently verify important findings before acting on them.**

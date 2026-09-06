# Contributing to OMEN

Thanks for your interest in contributing to OMEN! 🛰️

OMEN is a local-first OSINT and defensive security project focused on publicly available information, privacy awareness, evidence-based investigation, and authorized security testing.

## Before you start

Please read the README and SECURITY.md before contributing.

Contributions must remain within legal, authorized, and defensive use cases. Do not submit credentials, API keys, private personal information, scraped private-account data, or material obtained through unauthorized access.

## Ways to contribute

You do not need to be an expert or write code to help. Useful contributions include:

- Bug fixes and reliability improvements
- New defensive security checks
- Public-web OSINT improvements
- Better evidence and accuracy handling
- UI/UX improvements
- Documentation and examples
- Tests and CI improvements
- Accessibility improvements
- Performance improvements
- Security reviews and responsible vulnerability reports

## Development setup

Requirements:

- Node.js 18 or newer
- npm
- Git

Clone the repository, install dependencies, and run the local server:

```bash
git clone https://github.com/amoghbalapurepy-cmd/Omen-Osint.git
cd Omen-Osint
npm ci
npm start
```

Before opening a pull request, run:

```bash
npm run check
```

## Pull requests

1. Create a focused branch for your change.
2. Keep the change as small and understandable as possible.
3. Do not commit `.env` files, API keys, tokens, passwords, or personal data.
4. Test your change locally.
5. Run `npm run check` before submitting.
6. Explain what changed and why in the pull request description.

For larger changes, opening an issue first is encouraged so the approach can be discussed before implementation.

## Issues

When reporting a bug, include:

- What you expected to happen
- What actually happened
- Steps to reproduce it
- Relevant environment information
- Logs or screenshots with secrets and personal information removed

For feature requests, explain the problem the feature would solve and, if possible, suggest a small implementation direction.

## Good first contributions

New contributors are especially welcome to work on issues marked `good first issue` or `help wanted`.

## Code and security expectations

OMEN is intended for defensive security research, privacy awareness, public-web investigation, and authorized testing. Contributions that facilitate unauthorized access, credential theft, privacy invasion, or abuse will not be accepted.

If you discover a security vulnerability, please follow SECURITY.md instead of opening a public issue with sensitive details.

## License

By contributing to OMEN, you agree that your contributions are provided under the repository's MIT License.

Thanks for helping make OMEN better!
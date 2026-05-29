# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/),
and this project adheres to [Semantic Versioning](https://semver.org/).

## [1.0.0] - 2026-05-29

### Added
- `resolve` command — resolve latest version and download URL for any platform
- `fetch` command — download and extract SDK archive (zip/tar.gz)
- `platforms` command — list all available platform keys
- HTTPS-only downloads with `follow-redirects`
- Zip Slip and symlink escape protection in custom unzip
- Unix file mode preservation from zip central directory
- Timeout on all HTTP requests (10s API, 60s downloads)
- Pre-built binaries: linux-x64, macos-x64, macos-arm64, win-x64
- ESLint + Prettier with pre-commit hooks (husky + lint-staged)
- GitHub Actions workflows (lint, test, e2e, release)
- Dependabot for npm and GitHub Actions updates
- E2E tests against live BrightSDK API
- README with CLI usage examples and badges

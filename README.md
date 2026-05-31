# bright-sdk-download

> BrightSDK download CLI — resolve versions, fetch and extract SDK archives.

[![E2E](https://github.com/BrightSDK/bright-sdk-downloader/actions/workflows/e2e.yml/badge.svg)](https://github.com/BrightSDK/bright-sdk-downloader/actions/workflows/e2e.yml)
[![Lint](https://github.com/BrightSDK/bright-sdk-downloader/actions/workflows/lint.yml/badge.svg)](https://github.com/BrightSDK/bright-sdk-downloader/actions/workflows/lint.yml)
[![Test](https://github.com/BrightSDK/bright-sdk-downloader/actions/workflows/test.yml/badge.svg)](https://github.com/BrightSDK/bright-sdk-downloader/actions/workflows/test.yml)
[![Release](https://github.com/BrightSDK/bright-sdk-downloader/actions/workflows/release.yml/badge.svg)](https://github.com/BrightSDK/bright-sdk-downloader/actions/workflows/release.yml)

## Demo

![CLI usage demo](demo/usage.gif)

## What it does

Single source of truth for downloading BrightSDK archives across all integration tools (Node CLI, Gradle plugin, Unity plugin). Provides:

- **Version resolution** — query the BrightSDK API for latest versions and download URLs
- **Archive download** — fetch `.tar.gz` or `.zip` archives from CDN
- **Extraction** — unpack with Zip Slip protection, symlink safety, and Unix mode preservation

## Installation

### As a Node.js library

```bash
npm install bright-sdk-download
```

```js
const {
    resolve_sdk,
    fetch_sdk,
    list_platforms,
} = require('bright-sdk-download');

const info = await resolve_sdk('android');
// { platform: 'android', version: '1.623.17', url: 'https://...' }

await fetch_sdk('tizen', 'latest', './libs');
// Downloads + extracts to ./libs/
```

### As a standalone binary

Download from [GitHub Releases](https://github.com/BrightSDK/bright-sdk-download/releases):

| Platform    | Binary                   |
| ----------- | ------------------------ |
| Linux x64   | `bright-sdk-linux-x64`   |
| macOS x64   | `bright-sdk-macos-x64`   |
| macOS ARM64 | `bright-sdk-macos-arm64` |
| Windows x64 | `bright-sdk-win-x64.exe` |

No Node.js required to run the binaries.

## CLI Usage

```bash
export SDK_API_KEY=<your-api-key>

# Resolve latest version + download URL (JSON to stdout)
bright-sdk resolve -p android

# Download and extract SDK archive
bright-sdk fetch -p tizen -o ./libs

# List all available platforms
bright-sdk platforms
```

### Commands

| Command     | Description                    | Output                                   |
| ----------- | ------------------------------ | ---------------------------------------- |
| `resolve`   | Resolve version + download URL | JSON: `{platform, version, url}`         |
| `fetch`     | Download and extract archive   | JSON: `{platform, version, url, output}` |
| `platforms` | List available platform keys   | JSON array: `[{key, last_version}]`      |

### Options

| Flag             | Description                                                                        | Default  |
| ---------------- | ---------------------------------------------------------------------------------- | -------- |
| `-p, --platform` | Platform key (`android`, `ios`, `tizen`, `webos`, `node`, `win`, `macos`, `unity`) | required |
| `-v, --version`  | SDK version or `latest`                                                            | `latest` |
| `-o, --output`   | Output directory (fetch only)                                                      | `.`      |

### Environment

| Variable      | Required | Description                                                                                                        |
| ------------- | -------- | ------------------------------------------------------------------------------------------------------------------ |
| `SDK_API_KEY` | Yes      | BrightSDK API key for authentication — [get one here](https://bright-sdk.com/cp/settings/company_profile#api_keys) |

## Integration with other tools

### Gradle plugin (Java)

```java
ProcessBuilder pb = new ProcessBuilder(
    getBrightSdkBinary(), "fetch", "-p", "android", "-o", cacheDir);
pb.environment().put("SDK_API_KEY", System.getenv("SDK_API_KEY"));
Process proc = pb.start();
int exitCode = proc.waitFor();
```

### Unity plugin (C#)

```csharp
var proc = new Process();
proc.StartInfo.FileName = GetBrightSdkBinary();
proc.StartInfo.Arguments = "resolve -p unity";
proc.StartInfo.Environment["SDK_API_KEY"] = apiKey;
proc.StartInfo.RedirectStandardOutput = true;
proc.Start();
string json = proc.StandardOutput.ReadToEnd();
```

### Node.js (as library)

```js
const {
    resolve_sdk,
    fetch_sdk,
    list_platforms,
} = require('bright-sdk-download');
```

## API

### `resolve_sdk(platform, version?)`

Returns `{platform, version, url, sha256?}`.

### `fetch_sdk(platform, version?, output?)`

Downloads + extracts. Returns `{platform, version, url, output}`.

### `list_platforms()`

Returns `[{key, last_version}, ...]`.

### `fetch_releases(url?)`

Low-level: fetches raw config JSON from the API.

### `resolve_url_tpl(releases, platform_key, version)`

Low-level: resolves `{{base}}/{{platform}}/{{version}}` templates.

### `download_from_url(url, filename)`

Low-level: HTTPS download with redirect following.

### `extract(archive_path, out_dir)`

Extracts `.tar.gz` or `.zip` archive safely.

## Development

```bash
git clone https://github.com/BrightSDK/bright-sdk-download.git
cd bright-sdk-download
npm install
```

| Command                | Description               |
| ---------------------- | ------------------------- |
| `npm test`             | Run unit tests            |
| `npm run lint`         | ESLint check              |
| `npm run format:check` | Prettier check            |
| `npm run validate`     | Lint + format + test      |
| `npm run build`        | Compile binaries with pkg |

## Releasing

1. Bump version in `package.json`
2. Tag: `git tag v1.x.x && git push --tags`
3. GitHub Actions builds binaries and creates a release

## Security

- Archives are extracted with **Zip Slip protection**
- Symlinks are validated against directory escape
- `tar` extraction uses `execFileSync` (no shell interpolation)
- CI logs never expose CDN URLs or SDK asset paths
- `SDK_API_KEY` is passed via environment variable, never CLI args

## License

ISC

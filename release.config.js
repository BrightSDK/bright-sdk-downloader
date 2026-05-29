// Release Manager Configuration for bright-sdk-download
// Usage: release-manager -c release.config.js

module.exports = {
    // Build binaries before release (CI uses 'npm run build' for all platforms)
    buildCmd: 'npm run build:local',

    // Compiled binaries to package
    artifactsPattern: 'dist/bright-sdk-*',

    // CDN-style versioned output
    outputDir: 'releases',
    versionDirectories: ['major', 'minor', 'patch', 'latest'],
    generateManifest: true,
};

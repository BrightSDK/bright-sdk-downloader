'use strict';

const { resolve_url_tpl } = require('../src/index.js');

describe('resolve_url_tpl()', function () {
    const releases = {
        templates: {
            base: 'https://cdn.example.com/static',
            named_tpl: 'extra',
        },
        platforms: {
            android: {
                last_version: '1.0.0',
                url_tpl: '{{base}}/sdk_{{platform}}-{{version}}.tar.gz',
            },
            custom: {
                last_version: '2.0.0',
                url_tpl: '{{base}}/{{named_tpl}}/sdk-{{version}}.zip',
            },
        },
    };

    it('should substitute base, platform and version', function () {
        const url = resolve_url_tpl(releases, 'android', '1.2.3');
        expect(url).to.equal(
            'https://cdn.example.com/static/sdk_android-1.2.3.tar.gz',
        );
    });

    it('should substitute named templates', function () {
        const url = resolve_url_tpl(releases, 'custom', '2.0.0');
        expect(url).to.equal(
            'https://cdn.example.com/static/extra/sdk-2.0.0.zip',
        );
    });

    it('should return null for unknown platform', function () {
        const url = resolve_url_tpl(releases, 'unknown', '1.0.0');
        expect(url).to.equal(null);
    });
});

describe('module exports', function () {
    const sdk = require('../src/index.js');

    it('should export all expected functions', function () {
        expect(sdk.fetch_releases).to.be.a('function');
        expect(sdk.resolve_url_tpl).to.be.a('function');
        expect(sdk.resolve_sdk).to.be.a('function');
        expect(sdk.download_from_url).to.be.a('function');
        expect(sdk.verify_file_sha256).to.be.a('function');
        expect(sdk.extract).to.be.a('function');
        expect(sdk.fetch_sdk).to.be.a('function');
        expect(sdk.list_platforms).to.be.a('function');
    });

    it('should export RELEASES_URL constant', function () {
        expect(sdk.RELEASES_URL).to.be.a('string');
        expect(sdk.RELEASES_URL).to.include('bright-sdk.com');
    });
});

describe('verify_file_sha256()', function () {
    const fs = require('fs-extra');
    const path = require('path');
    const os = require('os');
    const crypto = require('crypto');
    const { verify_file_sha256 } = require('../src/index.js');

    let tmpFile;
    const content = 'security-test-data';
    const expectedHash = crypto
        .createHash('sha256')
        .update(content)
        .digest('hex');

    beforeEach(async function () {
        tmpFile = path.join(os.tmpdir(), `test-sha-${Date.now()}.txt`);
        await fs.writeFile(tmpFile, content);
    });

    afterEach(async function () {
        await fs.remove(tmpFile);
    });

    it('should resolve when checksum matches', async function () {
        const hash = await verify_file_sha256(tmpFile, expectedHash);
        expect(hash).to.equal(expectedHash);
    });

    it('should reject when checksum does not match', async function () {
        let err;
        try {
            await verify_file_sha256(
                tmpFile,
                '0000000000000000000000000000000000000000000000000000000000000000',
            );
        } catch (e) {
            err = e;
        }
        expect(err).to.be.an('error');
        expect(err.message).to.include('SHA-256 mismatch');
    });
});

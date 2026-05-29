// LICENSE_CODE ZON
'use strict'; /*jslint node:true es9:true*/
const https = require('follow-redirects').https;
const fs = require('fs-extra');
const {execSync} = require('child_process');
const path = require('path');
const {unzip} = require('./unzip.js');

const RELEASES_URL = 'https://bright-sdk.com/sdk_api/sdk/integration/config';

const fetch_releases = (releases_url = RELEASES_URL)=>new Promise(
    (resolve, reject)=>{
    const api_key = process.env.SDK_API_KEY;
    if (!api_key)
    {
        return void reject(
            new Error('SDK_API_KEY environment variable is required'));
    }
    const request = https.get(releases_url, {
        headers: {
            'api-key': api_key,
            'User-Agent': 'bright-sdk-download/1.0',
        },
    }, response=>{
        if (response.statusCode < 200 || response.statusCode >= 300)
        {
            response.resume();
            return void reject(new Error(
                `Releases fetch failed: HTTP ${response.statusCode}`));
        }
        let data = '';
        response.on('data', chunk=>{ data += chunk; });
        response.on('end', ()=>{
            try { resolve(JSON.parse(data)); }
            catch (e)
            {
                reject(new Error(
                    `Failed to parse releases JSON: ${e.message}`));
            }
        });
    });
    request.on('error', reject);
    request.setTimeout(10000, ()=>{
        request.destroy(new Error('Releases fetch timed out'));
    });
});

const resolve_url_tpl = (releases, platform_key, ver)=>{
    const platform = (releases.platforms||{})[platform_key];
    if (!platform?.url_tpl)
        return null;
    let url = platform.url_tpl;
    const {base, ...named} = releases.templates || {};
    for (const [key, val] of Object.entries(named))
    {
        if (!/^[a-zA-Z_][a-zA-Z0-9_]*$/.test(key))
            continue;
        url = url.replace(new RegExp(`\\{\\{${key}\\}\\}`, 'g'), val||'');
    }
    url = url.replace(/\{\{base\}\}/g, base||'');
    url = url.replace(/\{\{platform\}\}/g, platform_key);
    url = url.replace(/\{\{version\}\}/g, ver);
    return url;
};

const resolve_sdk = async (platform_key, version = 'latest')=>{
    const releases = await fetch_releases();
    const platform_data = releases.platforms?.[platform_key];
    if (!platform_data)
    {
        const available = Object.keys(releases.platforms||{}).join(', ');
        throw new Error(`Unknown platform '${platform_key}'. `
            +`Available: ${available}`);
    }
    const ver = version == 'latest'
        ? platform_data.last_version : version;
    if (!ver)
        throw new Error(`No latest version for platform '${platform_key}'`);
    const url = platform_data.url
        || resolve_url_tpl(releases, platform_key, ver);
    if (!url)
    {
        throw new Error(
            `Cannot resolve download URL for ${platform_key}@${ver}`);
    }
    const result = {platform: platform_key, version: ver, url};
    if (platform_data.sha256)
        result.sha256 = platform_data.sha256;
    return result;
};

const download_from_url = (url, fname)=>new Promise((resolve, reject)=>{
    const request = https.get(url, {
        headers: {
            'User-Agent': 'bright-sdk-download/1.0',
        },
    }, response=>{
        if (response.statusCode < 200 || response.statusCode >= 300)
        {
            response.resume();
            return reject(new Error(
                `Download failed: HTTP ${response.statusCode} for ${url}`));
        }
        const ws = fs.createWriteStream(fname);
        ws.on('error', reject);
        response.pipe(ws);
        ws.on('finish', resolve);
    });
    request.on('error', reject);
    request.setTimeout(60000, ()=>{
        request.destroy(new Error('Download timed out'));
    });
});

const extract = async (archive_path, out_dir)=>{
    if (archive_path.endsWith('.tar.gz') || archive_path.endsWith('.tgz'))
        execSync(`tar -xzf "${archive_path}" -C "${out_dir}"`);
    else
        await unzip(archive_path, out_dir);
};

const fetch_sdk = async (platform_key, version = 'latest', output = '.')=>{
    const resolved = await resolve_sdk(platform_key, version);
    const out_dir = path.resolve(output);
    await fs.ensureDir(out_dir);
    const url_path = new URL(resolved.url).pathname;
    const ext = url_path.endsWith('.tar.gz') ? '.tar.gz'
        : path.extname(url_path) || '.zip';
    const archive_path = path.join(out_dir,
        `brightsdk-${platform_key}-${resolved.version}${ext}`);
    await download_from_url(resolved.url, archive_path);
    await extract(archive_path, out_dir);
    await fs.remove(archive_path);
    return {...resolved, output: out_dir};
};

const list_platforms = async ()=>{
    const releases = await fetch_releases();
    return Object.entries(releases.platforms||{}).map(
        ([key, val])=>({key, last_version: val.last_version}));
};

module.exports = {
    RELEASES_URL,
    fetch_releases,
    resolve_url_tpl,
    resolve_sdk,
    download_from_url,
    extract,
    fetch_sdk,
    list_platforms,
};

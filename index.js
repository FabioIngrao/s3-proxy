import AWS from 'aws-sdk';
import awsConfig from 'aws-config';
import urljoin from 'url-join';
import mime from 'mime';
import base64 from 'base64-stream';
import debug0 from 'debug';
import React from 'react';
import ReactDOM from 'react-dom/server';

const pick = require('lodash.pick');
const trim = require('lodash.trim');
const map = require('lodash.map');
const reject = require('lodash.reject');
const assign = require('lodash.assign');

const debug = debug0('s3-proxy');
// HTTP headers from the AWS request to forward along
const awsForwardHeaders = ['content-type', 'last-modified', 'etag', 'cache-control'];


/* istanbul ignore next */
const S3Proxy = (options) => {
    const s3 = new AWS.S3(assign(awsConfig(options),
        pick(options, 'endpoint', 's3ForcePathStyle')));

    const listKeys = (req, res, next) => {
        console.log('listKeys');
        let folderPath = req.originalUrl.substr(req.baseUrl.length);
        const parts = folderPath.split('/');
        if (parts.length < 3) {
            return res.status(400).send(`Invalid path: ${folderPath}`);
        }
        const Bucket = parts[2];
        folderPath = parts.splice(3, parts.length).join('/');

        const s3Params = {
            Bucket,
            Prefix: options.prefix ? urljoin(options.prefix, folderPath) : folderPath,
            Delimiter: '/',
            MaxKeys: 300,
        };
        console.log(`listKeys - s3Params: ${JSON.stringify(s3Params)}`);
        debug('list s3 keys at', s3Params.Prefix);
        const makeURL = (val, isFolder) => {
            const classNames = `icon ${isFolder ? 'dir' : 'file'}`;
            return (<div className="container"><a className={classNames} href={val}>{val}</a></div>);
        };
        s3.listObjectsV2(s3Params, (err, data) => {
            if (err) {
                return res.status(400).send("Could not read S3 keys:  ".concat(s3Params.prefix, " ").concat(s3Params.bucket));
            }

            // const keys = [];
            const files = [];
            const folders = {};
            console.log(`data: ${JSON.stringify(data)}`);
            const createLinks = (list, isFolder) => list.map((elem) => makeURL(elem, isFolder));

            map(data.Contents, 'Key').forEach((key) => {
                // Chop off the prefix path
                console.log(`key: ${key}`);
                const actualKey = key.substr(s3Params.Prefix.length);
                const parts = actualKey.split('/');
                if (parts.length > 1) { // non empty folder
                    folders[parts[0]] = true;
                } else if (parts[0]) {
                    files.push(parts[0]);
                }

                // if (key !== s3Params.Prefix) {
                //   if (isEmpty(s3Params.Prefix)) {
                //     keys.push(makeURL(key));
                //   } else {
                //     keys.push(makeURL(key.substr(s3Params.Prefix.length)));
                //   }
                // }
            });
            data.CommonPrefixes.forEach((item) => {
                const folderName = item.Prefix.replace(s3Params.Prefix, '');
                folders[folderName] = true;
            });

            console.log(`Files: ${JSON.stringify(files)}`);
            console.log(`Folders: ${JSON.stringify(folders)}`);

            const allFolders = createLinks(Object.keys(folders), true);
            const allFiles = createLinks(files);

            res.set('Content-Type', 'text/html');
            res.send(`<html>
<head>
    <style>
        div.container {
            height: 40px;
            font-size: 24px;
        }
        a.icon {
            padding-left: 32px;
        }
        a.dir {
            background: url("data:image/svg+xml;base64,PD94bWwgdmVyc2lvbj0iMS4wIiA/PjxzdmcgaGVpZ2h0PSI0OCIgdmlld0JveD0iMCAwIDQ4IDQ4IiB3aWR0aD0iNDgiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGRlZnM+PHN0eWxlPi5jbHMtMXtmaWxsOiNmNmI0NDU7fS5jbHMtMntmaWxsOiNmZWQwNDk7fS5jbHMtM3tmaWxsOiNkMGQ3ZGY7fS5jbHMtNHtmaWxsOiM0NzRjNTQ7fTwvc3R5bGU+PC9kZWZzPjx0aXRsZS8+PGcgZGF0YS1uYW1lPSI0NS1GaWxlLURvY3VtZW50LXNoYXJlIiBpZD0iXzQ1LUZpbGUtRG9jdW1lbnQtc2hhcmUiPjxwYXRoIGNsYXNzPSJjbHMtMSIgZD0iTTM5LDEzSDIyVjdIMzhhLjk3OS45NzksMCwwLDEsMSwxWiIvPjxwYXRoIGNsYXNzPSJjbHMtMiIgZD0iTTIyLDd2Nkg0M2E0LDQsMCwwLDEsNCw0VjQzYTQsNCwwLDAsMS00LDRINWE0LDQsMCwwLDEtNC00VjVTMSwxLDUsMUgxOHM0LDAsNCw0WiIvPjxjaXJjbGUgY2xhc3M9ImNscy0zIiBjeD0iMjgiIGN5PSIzOCIgcj0iMyIvPjxjaXJjbGUgY2xhc3M9ImNscy0zIiBjeD0iMjAiIGN5PSIzMCIgcj0iMyIvPjxjaXJjbGUgY2xhc3M9ImNscy0zIiBjeD0iMjgiIGN5PSIyMiIgcj0iMyIvPjxwYXRoIGNsYXNzPSJjbHMtNCIgZD0iTTQzLDEySDEyYTEsMSwwLDAsMCwwLDJINDNhMywzLDAsMCwxLDMsM1Y0M2EzLDMsMCwwLDEtMywzSDVhMywzLDAsMCwxLTMtM1Y1LjAwNkEyLjg1NCwyLjg1NCwwLDAsMSw1LDJIMThhMi44NTMsMi44NTMsMCwwLDEsMywzVjdhMSwxLDAsMCwwLDEsMUgzOFY5YTEsMSwwLDAsMCwyLDBWOGExLjk1OSwxLjk1OSwwLDAsMC0yLTJIMjNWNWE0LjgyMSw0LjgyMSwwLDAsMC01LTVINUE0LjgyMSw0LjgyMSwwLDAsMCwwLDVWNDNhNS4wMDYsNS4wMDYsMCwwLDAsNSw1SDQzYTUuMDA2LDUuMDA2LDAsMCwwLDUtNVYxN0E1LjAwNiw1LjAwNiwwLDAsMCw0MywxMloiLz48cGF0aCBjbGFzcz0iY2xzLTQiIGQ9Ik0yMi4wMTksMjYuNTY3QTMuOTQ3LDMuOTQ3LDAsMCwwLDIwLDI2YTQsNCwwLDAsMCwwLDgsMy45NDcsMy45NDcsMCwwLDAsMi4wMTktLjU2N2wyLjI3NCwyLjI3NGEuOTc3Ljk3NywwLDAsMCwuMzEuMjA2LDQuMDM1LDQuMDM1LDAsMSwwLDEuMzEtMS4zMS45NzcuOTc3LDAsMCwwLS4yMDYtLjMxbC0yLjI3NC0yLjI3NGEzLjg3OCwzLjg3OCwwLDAsMCwwLTQuMDM4bDIuMjc0LTIuMjc0YS45NzcuOTc3LDAsMCwwLC4yMDYtLjMxLDQuMDM1LDQuMDM1LDAsMSwwLTEuMzEtMS4zMS45NzcuOTc3LDAsMCwwLS4zMS4yMDZaTTI4LDM2YTIsMiwwLDEsMS0yLDJBMiwyLDAsMCwxLDI4LDM2Wk0xOCwzMGEyLDIsMCwxLDEsMiwyQTIsMiwwLDAsMSwxOCwzMFpNMjgsMjBhMiwyLDAsMSwxLTIsMkEyLDIsMCwwLDEsMjgsMjBaIi8+PC9nPjwvc3ZnPg==") left top no-repeat;
            background-size: contain;
        }
        a.file {
            background: url("data:image/svg+xml;base64,PD94bWwgdmVyc2lvbj0iMS4wIiA/PjxzdmcgaGVpZ2h0PSI0OCIgdmlld0JveD0iMCAwIDQ4IDQ4IiB3aWR0aD0iNDgiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGRlZnM+PHN0eWxlPi5jbHMtMXtmaWxsOiNmZmY7fS5jbHMtMntmaWxsOiNkMGQ3ZGY7fS5jbHMtM3tmaWxsOiM0NzRjNTQ7fTwvc3R5bGU+PC9kZWZzPjx0aXRsZS8+PGcgZGF0YS1uYW1lPSIxLUZpbGUtRG9jdW1lbnQiIGlkPSJfMS1GaWxlLURvY3VtZW50Ij48cGF0aCBjbGFzcz0iY2xzLTEiIGQ9Ik00MywxNFY0M2E0LDQsMCwwLDEtNCw0SDlzLTQsMC00LTRWNUE0LDQsMCwwLDEsOSwxSDMwdjlhNCw0LDAsMCwwLDQsNFoiLz48cGF0aCBjbGFzcz0iY2xzLTIiIGQ9Ik00MywxNEgzNGE0LDQsMCwwLDEtNC00VjFaIi8+PHBhdGggY2xhc3M9ImNscy0zIiBkPSJNNDMuOTIyLDEzLjYxNWEuOTk0Ljk5NCwwLDAsMC0uMjE1LS4zMjJsLTEzLTEzQTEsMSwwLDAsMCwzMCwwSDlBNS4wMDYsNS4wMDYsMCwwLDAsNCw1VjQzYTQuODIxLDQuODIxLDAsMCwwLDUsNUgzOWE1LjAwNiw1LjAwNiwwLDAsMCw1LTVWMTRBLjk4OC45ODgsMCwwLDAsNDMuOTIyLDEzLjYxNVpNMzksNDZIOS4wMDVBMi44NTMsMi44NTMsMCwwLDEsNiw0M1Y1QTMsMywwLDAsMSw5LDJIMjkuNTg2bDExLDExSDM0YTMsMywwLDAsMS0zLTNWN2ExLDEsMCwwLDAtMiwwdjNhNS4wMDYsNS4wMDYsMCwwLDAsNSw1aDhWNDNBMywzLDAsMCwxLDM5LDQ2WiIvPjxwYXRoIGNsYXNzPSJjbHMtMyIgZD0iTTM3LDI0SDExYTEsMSwwLDAsMCwwLDJIMzdhMSwxLDAsMCwwLDAtMloiLz48cGF0aCBjbGFzcz0iY2xzLTMiIGQ9Ik0zNywzMEgxMWExLDEsMCwwLDAsMCwySDM3YTEsMSwwLDAsMCwwLTJaIi8+PHBhdGggY2xhc3M9ImNscy0zIiBkPSJNMzcsMzVIMzVhMSwxLDAsMCwwLDAsMmgyYTEsMSwwLDAsMCwwLTJaIi8+PHBhdGggY2xhc3M9ImNscy0zIiBkPSJNMzEsMzVIMjlhMSwxLDAsMCwwLDAsMmgyYTEsMSwwLDAsMCwwLTJaIi8+PC9nPjwvc3ZnPg==") left top no-repeat;
            background-size: contain;
        }
    </style>
</head>
<body>
<h1>Index of ${s3Params.Prefix}</h1>
<br/>
${ReactDOM.renderToString(allFolders)}
${ReactDOM.renderToString(allFiles)}
</body>
</html>`);
        });
    };

    // The url will have the format: <host>/s3/bucket-name/key
    function getObject(req, res, next) {
        // This will get everything in the path following the mountpath
        let s3Key = decodeURIComponent(req.originalUrl.substr(req.baseUrl.length + 1));

        // If the key is empty (this occurs if a request comes in for a url ending in '/'), and there is a defaultKey
        // option present on options, use the default key
        // E.g. if someone wants to route '/' to '/index.html'
        if (s3Key === '' && options.defaultKey) s3Key = options.defaultKey;

        // Chop off the querystring, it causes problems with SDK.
        const queryIndex = s3Key.indexOf('?');
        if (queryIndex !== -1) {
            s3Key = s3Key.substr(0, queryIndex);
        }

        // Strip out any path segments that start with a double dash '--'. This is just used
        // to force a cache invalidation.
        s3Key = reject(s3Key.split('/'), (segment) => segment.slice(0, 2) === '--').join('/');


        const parts = s3Key.split('/');
        if (parts.length < 3) {
            return res.status(400).send(`Invalid path: ${s3Key}`);
        }
        const Bucket = parts[1];
        s3Key = parts.splice(2, parts.length).join('/');

        const s3Params = {
            Bucket,
            Key: options.prefix ? urljoin(options.prefix, s3Key) : s3Key,
        };

        debug('get s3 object with key %s', s3Params.Key);

        const base64Encode = req.acceptsEncodings(['base64']) === 'base64';

        // The IfNoneMatch in S3 won't match if client is requesting base64 encoded response.
        if (req.headers['if-none-match'] && !base64Encode) {
            s3Params.IfNoneMatch = req.headers['if-none-match'];
        }

        debug('read s3 object', s3Params.Key);
        const s3Request = s3.getObject(s3Params);

        // Write a custom http header with the path to the S3 object being proxied
        const headerPrefix = req.app.settings.customHttpHeaderPrefix || 'x-4front-';
        res.setHeader(`${headerPrefix}s3-proxy-key`, s3Params.Key);

        s3Request.on('httpHeaders', (statusCode, s3Headers) => {
            debug('received httpHeaders');

            // Get the contentType from the headers
            awsForwardHeaders.forEach((header) => {
                let headerValue = s3Headers[header];

                if (header === 'content-type') {
                    if (headerValue === 'application/octet-stream' || headerValue === 'binary/octet-stream') {
                        // If the content-type from S3 is the default "application/octet-stream",
                        // try and get a more accurate type based on the extension.
                        headerValue = mime.getType(req.path);
                    }
                } else if (header === 'cache-control') {
                    if (options.overrideCacheControl) {
                        debug('override cache-control to', options.overrideCacheControl);
                        headerValue = options.overrideCacheControl;
                    } else if (!headerValue && options.defaultCacheControl) {
                        debug('default cache-control to', options.defaultCacheControl);
                        headerValue = options.defaultCacheControl;
                    }
                } else if (header === 'etag' && base64Encode) {
                    headerValue = `"${trim(headerValue, '"')}_base64"`;
                } else if (header === 'content-length' && base64Encode) {
                    // Clear out the content-length if we are going to base64 encode the response
                    headerValue = null;
                }

                if (headerValue) {
                    debug('set header %s=%s', header, headerValue);
                    res.set(header, headerValue);
                }
            });
        });

        debug('read stream %s', s3Params.Key);

        let readStream = s3Request.createReadStream()
            .on('error', (err) => {
                debug('readStream error');
                // If the code is PreconditionFailed and we passed an IfNoneMatch param
                // the object has not changed, so just return a 304 Not Modified response.
                if (err.code === 'NotModified'
                    || (err.code === 'PreconditionFailed' && s3Params.IfNoneMatch)) {
                    return res.status(304).end();
                }
                if (err.code === 'NoSuchKey') {
                    return res.status(404).send('Missing S3 Key');
                }
                return next(err);
            });

        if (base64Encode) {
            debug('base64 encode response');
            res.setHeader('Content-Encoding', 'base64');
            readStream = readStream.pipe(base64.encode());
        }

        readStream.pipe(res);
    }

    return (req, res, next) => {
        if (req.method !== 'GET') return next();

        // If a request is made to a url ending in '/', but there isn't a default file name,
        // return a list of s3 keys. Otherwise, let the getObject() method handle the request
        // E.g. if someone wants to route '/' to '/index.html' they should be able to bypass listKeys()
        console.log(`req.path.slice(-1): ${req.path.slice(-1)}`);
        if (req.path.slice(-1) === '/') {
            listKeys(req, res, next);
        } else {
            getObject(req, res, next);
        }
    };
};

export default S3Proxy;

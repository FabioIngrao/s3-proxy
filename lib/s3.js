import AWS from 'aws-sdk';
import awsConfig from 'aws-config';
import urljoin from 'url-join';
import mime from 'mime';
import base64 from 'base64-stream';
import debug0 from 'debug';
import simple_errors from 'simple-errors';

const pick = require('lodash.pick');
const trim = require('lodash.trim');
const map = require('lodash.map');
const isEmpty = require('lodash.isempty');
const reject = require('lodash.reject');
const assign = require('lodash.assign');
const debug = debug0('s3-proxy');
// HTTP headers from the AWS request to forward along
const awsForwardHeaders = ['content-type', 'last-modified', 'etag', 'cache-control'];


const S3Proxy = (options) => {

    const s3 = new AWS.S3(assign(awsConfig(options),
        pick(options, 'endpoint', 's3ForcePathStyle')));

    const listKeys = (req, res, next) => {
        let folderPath = req.originalUrl.substr(req.baseUrl.length);
        const parts = folderPath.split('/');
        if (parts.length < 3) {
            return next(Error.http(404, 'Invalid path', {code: 'invalid-path', key: s3Key}));
        }
        const Bucket = parts[1];
        folderPath = parts.splice(2, parts.length).join('/');

        const s3Params = {
            Bucket,
            Prefix: options.prefix ? urljoin(options.prefix, folderPath) : folderPath
        };

        debug('list s3 keys at', s3Params.Prefix);
        s3.listObjects(s3Params, function (err, data) {
            if (err) {
                return next(Error.create('Could not read S3 keys', {
                    prefix: s3Params.prefix,
                    bucket: s3Params.bucket
                }, err));
            }

            const keys = [];
            map(data.Contents, 'Key').forEach(function (key) {
                // Chop off the prefix path
                if (key !== s3Params.Prefix) {
                    if (isEmpty(s3Params.Prefix)) {
                        keys.push(key);
                    } else {
                        keys.push(key.substr(s3Params.Prefix.length));
                    }
                }
            });

            res.json(keys);
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
        s3Key = reject(s3Key.split('/'), function (segment) {
            return segment.slice(0, 2) === '--';
        }).join('/');


        const parts = s3Key.split('/');
        if (parts.length < 3) {
            return next(Error.http(404, 'Invalid path', {code: 'invalid-path', key: s3Key}));
        }
        const Bucket = parts[1];
        s3Key = parts.splice(2, parts.length).join('/');

        const s3Params = {
            Bucket,
            Key: options.prefix ? urljoin(options.prefix, s3Key) : s3Key
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
        res.setHeader(headerPrefix + 's3-proxy-key', s3Params.Key);

        s3Request.on('httpHeaders', function (statusCode, s3Headers) {
            debug('received httpHeaders');

            // Get the contentType from the headers
            awsForwardHeaders.forEach(function (header) {
                let headerValue = s3Headers[header];

                if (header === 'content-type') {
                    if (headerValue === 'application/octet-stream') {
                        // If the content-type from S3 is the default "application/octet-stream",
                        // try and get a more accurate type based on the extension.
                        headerValue = mime.lookup(req.path);
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
                    headerValue = '"' + trim(headerValue, '"') + '_base64' + '"';
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
            .on('error', function (err) {
                debug('readStream error');
                // If the code is PreconditionFailed and we passed an IfNoneMatch param
                // the object has not changed, so just return a 304 Not Modified response.
                if (err.code === 'NotModified' ||
                    (err.code === 'PreconditionFailed' && s3Params.IfNoneMatch)) {
                    return res.status(304).end();
                }
                if (err.code === 'NoSuchKey') {
                    return next(Error.http(404, 'Missing S3 key', {code: 'missingS3Key', key: s3Params.Key}));
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

    return function (req, res, next) {
        if (req.method !== 'GET') return next();

        //If a request is made to a url ending in '/', but there isn't a default file name,
        // return a list of s3 keys. Otherwise, let the getObject() method handle the request
        // E.g. if someone wants to route '/' to '/index.html' they should be able to bypass listKeys()
        if (!options.defaultKey && req.path.slice(-1) === '/') {
            listKeys(req, res, next);
        } else {
            getObject(req, res, next);
        }
    };
};

export default S3Proxy;

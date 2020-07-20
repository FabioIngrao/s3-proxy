"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports["default"] = void 0;

var _awsSdk = _interopRequireDefault(require("aws-sdk"));

var _awsConfig = _interopRequireDefault(require("aws-config"));

var _urlJoin = _interopRequireDefault(require("url-join"));

var _mime = _interopRequireDefault(require("mime"));

var _base64Stream = _interopRequireDefault(require("base64-stream"));

var _debug = _interopRequireDefault(require("debug"));

var _react = _interopRequireDefault(require("react"));

var _server = _interopRequireDefault(require("react-dom/server"));

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { "default": obj }; }

/* eslint-disable */
var pick = require('lodash.pick');

var trim = require('lodash.trim');

var map = require('lodash.map');

var reject = require('lodash.reject');

var assign = require('lodash.assign');

var debug = (0, _debug["default"])('s3-proxy'); // HTTP headers from the AWS request to forward along

var awsForwardHeaders = ['content-type', 'last-modified', 'etag', 'cache-control'];

var makeURL = function makeURL(val, isFolder, path) {
  var classNames = "icon ".concat(isFolder ? 'dir' : 'file');
  var s3path = path + val;
  return /*#__PURE__*/_react["default"].createElement(_react["default"].Fragment, null, /*#__PURE__*/_react["default"].createElement("div", {
    className: "container"
  }, /*#__PURE__*/_react["default"].createElement("a", {
    className: classNames,
    href: val
  }, val), /*#__PURE__*/_react["default"].createElement("span", null, ' '), /*#__PURE__*/_react["default"].createElement("button", {
    className: "btn",
    type: "button",
    "data-clipboard-text": s3path
  }, /*#__PURE__*/_react["default"].createElement("svg", {
    width: "24",
    height: "24",
    xmlns: "http://www.w3.org/2000/svg",
    fillRule: "evenodd",
    clipRule: "evenodd"
  }, /*#__PURE__*/_react["default"].createElement("path", {
    d: "M20 24h-20v-22h3c1.229 0 2.18-1.084 3-2h8c.82.916 1.771 2 3 2h3v9h-2v-7h-4l-2 2h-3.898l-2.102-2h-4v18h16v-5h2v7zm-10-4h-6v-1h6v1zm0-2h-6v-1h6v1zm6-5h8v2h-8v3l-5-4 5-4v3zm-6 3h-6v-1h6v1zm0-2h-6v-1h6v1zm0-2h-6v-1h6v1zm0-2h-6v-1h6v1zm-1-7c0 .552.448 1 1 1s1-.448 1-1-.448-1-1-1-1 .448-1 1z"
  })))));
};
/* istanbul ignore next */


var S3Proxy = function S3Proxy(options) {
  var s3 = new _awsSdk["default"].S3(assign((0, _awsConfig["default"])(options), pick(options, 'endpoint', 's3ForcePathStyle')));

  var generateFolderOutput = function generateFolderOutput(res, s3Params, allFolders, allFiles) {
    res.set('Content-Type', 'text/html');
    res.send("<html>\n<head>\n    <script src=\"https://cdnjs.cloudflare.com/ajax/libs/clipboard.js/2.0.4/clipboard.min.js\"></script>\n    <script>\n      function load() {\n        new ClipboardJS('.btn', {\n          target: function(trigger) {\n            if (trigger){\n              return trigger.nextElementSibling || trigger;\n            }\n            return document.getElementById('header');\n          }\n        });\n      }\n      window.onload = load;\n    </script>\n    <style>\n        div.container {\n            height: 40px;\n            font-size: 24px;\n        }\n        a.icon {\n            padding-left: 32px;\n        }\n        a.dir {\n            background: url(\"data:image/svg+xml;base64,PD94bWwgdmVyc2lvbj0iMS4wIiA/PjxzdmcgaGVpZ2h0PSI0OCIgdmlld0JveD0iMCAwIDQ4IDQ4IiB3aWR0aD0iNDgiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGRlZnM+PHN0eWxlPi5jbHMtMXtmaWxsOiNmNmI0NDU7fS5jbHMtMntmaWxsOiNmZWQwNDk7fS5jbHMtM3tmaWxsOiNkMGQ3ZGY7fS5jbHMtNHtmaWxsOiM0NzRjNTQ7fTwvc3R5bGU+PC9kZWZzPjx0aXRsZS8+PGcgZGF0YS1uYW1lPSI0NS1GaWxlLURvY3VtZW50LXNoYXJlIiBpZD0iXzQ1LUZpbGUtRG9jdW1lbnQtc2hhcmUiPjxwYXRoIGNsYXNzPSJjbHMtMSIgZD0iTTM5LDEzSDIyVjdIMzhhLjk3OS45NzksMCwwLDEsMSwxWiIvPjxwYXRoIGNsYXNzPSJjbHMtMiIgZD0iTTIyLDd2Nkg0M2E0LDQsMCwwLDEsNCw0VjQzYTQsNCwwLDAsMS00LDRINWE0LDQsMCwwLDEtNC00VjVTMSwxLDUsMUgxOHM0LDAsNCw0WiIvPjxjaXJjbGUgY2xhc3M9ImNscy0zIiBjeD0iMjgiIGN5PSIzOCIgcj0iMyIvPjxjaXJjbGUgY2xhc3M9ImNscy0zIiBjeD0iMjAiIGN5PSIzMCIgcj0iMyIvPjxjaXJjbGUgY2xhc3M9ImNscy0zIiBjeD0iMjgiIGN5PSIyMiIgcj0iMyIvPjxwYXRoIGNsYXNzPSJjbHMtNCIgZD0iTTQzLDEySDEyYTEsMSwwLDAsMCwwLDJINDNhMywzLDAsMCwxLDMsM1Y0M2EzLDMsMCwwLDEtMywzSDVhMywzLDAsMCwxLTMtM1Y1LjAwNkEyLjg1NCwyLjg1NCwwLDAsMSw1LDJIMThhMi44NTMsMi44NTMsMCwwLDEsMywzVjdhMSwxLDAsMCwwLDEsMUgzOFY5YTEsMSwwLDAsMCwyLDBWOGExLjk1OSwxLjk1OSwwLDAsMC0yLTJIMjNWNWE0LjgyMSw0LjgyMSwwLDAsMC01LTVINUE0LjgyMSw0LjgyMSwwLDAsMCwwLDVWNDNhNS4wMDYsNS4wMDYsMCwwLDAsNSw1SDQzYTUuMDA2LDUuMDA2LDAsMCwwLDUtNVYxN0E1LjAwNiw1LjAwNiwwLDAsMCw0MywxMloiLz48cGF0aCBjbGFzcz0iY2xzLTQiIGQ9Ik0yMi4wMTksMjYuNTY3QTMuOTQ3LDMuOTQ3LDAsMCwwLDIwLDI2YTQsNCwwLDAsMCwwLDgsMy45NDcsMy45NDcsMCwwLDAsMi4wMTktLjU2N2wyLjI3NCwyLjI3NGEuOTc3Ljk3NywwLDAsMCwuMzEuMjA2LDQuMDM1LDQuMDM1LDAsMSwwLDEuMzEtMS4zMS45NzcuOTc3LDAsMCwwLS4yMDYtLjMxbC0yLjI3NC0yLjI3NGEzLjg3OCwzLjg3OCwwLDAsMCwwLTQuMDM4bDIuMjc0LTIuMjc0YS45NzcuOTc3LDAsMCwwLC4yMDYtLjMxLDQuMDM1LDQuMDM1LDAsMSwwLTEuMzEtMS4zMS45NzcuOTc3LDAsMCwwLS4zMS4yMDZaTTI4LDM2YTIsMiwwLDEsMS0yLDJBMiwyLDAsMCwxLDI4LDM2Wk0xOCwzMGEyLDIsMCwxLDEsMiwyQTIsMiwwLDAsMSwxOCwzMFpNMjgsMjBhMiwyLDAsMSwxLTIsMkEyLDIsMCwwLDEsMjgsMjBaIi8+PC9nPjwvc3ZnPg==\") left top no-repeat;\n            background-size: contain;\n        }\n        a.file {\n            background: url(\"data:image/svg+xml;base64,PD94bWwgdmVyc2lvbj0iMS4wIiA/PjxzdmcgaGVpZ2h0PSI0OCIgdmlld0JveD0iMCAwIDQ4IDQ4IiB3aWR0aD0iNDgiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGRlZnM+PHN0eWxlPi5jbHMtMXtmaWxsOiNmZmY7fS5jbHMtMntmaWxsOiNkMGQ3ZGY7fS5jbHMtM3tmaWxsOiM0NzRjNTQ7fTwvc3R5bGU+PC9kZWZzPjx0aXRsZS8+PGcgZGF0YS1uYW1lPSIxLUZpbGUtRG9jdW1lbnQiIGlkPSJfMS1GaWxlLURvY3VtZW50Ij48cGF0aCBjbGFzcz0iY2xzLTEiIGQ9Ik00MywxNFY0M2E0LDQsMCwwLDEtNCw0SDlzLTQsMC00LTRWNUE0LDQsMCwwLDEsOSwxSDMwdjlhNCw0LDAsMCwwLDQsNFoiLz48cGF0aCBjbGFzcz0iY2xzLTIiIGQ9Ik00MywxNEgzNGE0LDQsMCwwLDEtNC00VjFaIi8+PHBhdGggY2xhc3M9ImNscy0zIiBkPSJNNDMuOTIyLDEzLjYxNWEuOTk0Ljk5NCwwLDAsMC0uMjE1LS4zMjJsLTEzLTEzQTEsMSwwLDAsMCwzMCwwSDlBNS4wMDYsNS4wMDYsMCwwLDAsNCw1VjQzYTQuODIxLDQuODIxLDAsMCwwLDUsNUgzOWE1LjAwNiw1LjAwNiwwLDAsMCw1LTVWMTRBLjk4OC45ODgsMCwwLDAsNDMuOTIyLDEzLjYxNVpNMzksNDZIOS4wMDVBMi44NTMsMi44NTMsMCwwLDEsNiw0M1Y1QTMsMywwLDAsMSw5LDJIMjkuNTg2bDExLDExSDM0YTMsMywwLDAsMS0zLTNWN2ExLDEsMCwwLDAtMiwwdjNhNS4wMDYsNS4wMDYsMCwwLDAsNSw1aDhWNDNBMywzLDAsMCwxLDM5LDQ2WiIvPjxwYXRoIGNsYXNzPSJjbHMtMyIgZD0iTTM3LDI0SDExYTEsMSwwLDAsMCwwLDJIMzdhMSwxLDAsMCwwLDAtMloiLz48cGF0aCBjbGFzcz0iY2xzLTMiIGQ9Ik0zNywzMEgxMWExLDEsMCwwLDAsMCwySDM3YTEsMSwwLDAsMCwwLTJaIi8+PHBhdGggY2xhc3M9ImNscy0zIiBkPSJNMzcsMzVIMzVhMSwxLDAsMCwwLDAsMmgyYTEsMSwwLDAsMCwwLTJaIi8+PHBhdGggY2xhc3M9ImNscy0zIiBkPSJNMzEsMzVIMjlhMSwxLDAsMCwwLDAsMmgyYTEsMSwwLDAsMCwwLTJaIi8+PC9nPjwvc3ZnPg==\") left top no-repeat;\n            background-size: contain;\n        }\n        button.btn {\n            background: transparent;\n            border: none;\n        }\n        svg {\n            margin-bottom: -4px;\n        }\n    </style>\n</head>\n<body>\n<h1 id=\"header\">Index of ".concat(s3Params.Prefix, "</h1>\n<br/>\n").concat(_server["default"].renderToString(allFolders), "\n").concat(_server["default"].renderToString(allFiles), "\n</body>\n</html>"));
  };

  var processList = function processList(res, s3Params, allFiles, allFolders) {
    s3.listObjectsV2(s3Params, function (err, data) {
      if (err) {
        return res.status(400).send("Could not read S3 keys:  ".concat(s3Params.prefix, " ").concat(s3Params.bucket));
      } // const keys = [];


      var files = [];
      var folders = {};
      console.log("data: ".concat(JSON.stringify(data)));
      var s3Path = "s3://".concat(s3Params.Bucket, "/").concat(s3Params.Prefix);

      var createLinks = function createLinks(list, isFolder, path) {
        return list.map(function (elem) {
          return makeURL(elem, isFolder, path);
        });
      };

      map(data.Contents, 'Key').forEach(function (key) {
        // Chop off the prefix path
        console.log("key: ".concat(key));
        var actualKey = key.substr(s3Params.Prefix.length);
        var parts = actualKey.split('/');

        if (parts.length > 1) {
          // non empty folder
          folders[parts[0]] = true;
        } else if (parts[0]) {
          files.push(parts[0]);
        } // if (key !== s3Params.Prefix) {
        //   if (isEmpty(s3Params.Prefix)) {
        //     keys.push(makeURL(key));
        //   } else {
        //     keys.push(makeURL(key.substr(s3Params.Prefix.length)));
        //   }
        // }

      });
      data.CommonPrefixes.forEach(function (item) {
        var folderName = item.Prefix.replace(s3Params.Prefix, '');
        folders[folderName] = true;
      });
      console.log("Files: ".concat(JSON.stringify(files)));
      console.log("Folders: ".concat(JSON.stringify(folders)));
      allFolders.push(createLinks(Object.keys(folders), true, s3Path));
      allFiles.push(createLinks(files, false, s3Path));

      if (data.IsTruncated) {
        // Set Marker to last returned key
        s3Params.ContinuationToken = data.NextContinuationToken;
        processList(res, s3Params, allFiles, allFolders);
      } else {
        generateFolderOutput(res, s3Params, allFolders, allFiles);
      }
    });
  };

  var listKeys = function listKeys(req, res, next) {
    console.log('listKeys');
    var decodedURL = decodeURIComponent(req.originalUrl);
    var folderPath = decodedURL.substr(req.baseUrl.length);
    var parts = folderPath.split('/');

    if (parts.length < 3) {
      return res.status(400).send("Invalid path: ".concat(folderPath));
    }

    var Bucket = parts[2];
    folderPath = parts.splice(3, parts.length).join('/');
    var s3Params = {
      Bucket: Bucket,
      Prefix: options.prefix ? (0, _urlJoin["default"])(options.prefix, folderPath) : folderPath,
      Delimiter: '/',
      MaxKeys: 300
    };
    console.log("listKeys - s3Params: ".concat(JSON.stringify(s3Params)));
    debug('list s3 keys at', s3Params.Prefix);
    var allFiles = [];
    var allFolders = [];
    processList(res, s3Params, allFiles, allFolders);
  }; // The url will have the format: <host>/s3/bucket-name/key


  function getObject(req, res, next) {
    // This will get everything in the path following the mountpath
    var s3Key = decodeURIComponent(req.originalUrl.substr(req.baseUrl.length + 1)); // If the key is empty (this occurs if a request comes in for a url ending in '/'), and there is a defaultKey
    // option present on options, use the default key
    // E.g. if someone wants to route '/' to '/index.html'

    if (s3Key === '' && options.defaultKey) s3Key = options.defaultKey; // Chop off the querystring, it causes problems with SDK.

    var queryIndex = s3Key.indexOf('?');

    if (queryIndex !== -1) {
      s3Key = s3Key.substr(0, queryIndex);
    } // Strip out any path segments that start with a double dash '--'. This is just used
    // to force a cache invalidation.


    s3Key = reject(s3Key.split('/'), function (segment) {
      return segment.slice(0, 2) === '--';
    }).join('/');
    var parts = s3Key.split('/');

    if (parts.length < 3) {
      return res.status(400).send("Invalid path: ".concat(s3Key));
    }

    var Bucket = parts[1];
    s3Key = parts.splice(2, parts.length).join('/');
    var s3Params = {
      Bucket: Bucket,
      Key: options.prefix ? (0, _urlJoin["default"])(options.prefix, s3Key) : s3Key
    };
    debug('get s3 object with key %s', s3Params.Key);
    var base64Encode = req.acceptsEncodings(['base64']) === 'base64'; // The IfNoneMatch in S3 won't match if client is requesting base64 encoded response.

    if (req.headers['if-none-match'] && !base64Encode) {
      s3Params.IfNoneMatch = req.headers['if-none-match'];
    }

    debug('read s3 object', s3Params.Key);
    var s3Request = s3.getObject(s3Params); // Write a custom http header with the path to the S3 object being proxied

    var headerPrefix = req.app.settings.customHttpHeaderPrefix || 'x-4front-';
    res.setHeader("".concat(headerPrefix, "s3-proxy-key"), s3Params.Key);
    s3Request.on('httpHeaders', function (statusCode, s3Headers) {
      debug('received httpHeaders'); // Get the contentType from the headers

      awsForwardHeaders.forEach(function (header) {
        var headerValue = s3Headers[header];

        if (header === 'content-type') {
          if (headerValue === 'application/octet-stream' || headerValue === 'binary/octet-stream') {
            // If the content-type from S3 is the default "application/octet-stream",
            // try and get a more accurate type based on the extension.
            headerValue = _mime["default"].getType(req.path);
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
          headerValue = "\"".concat(trim(headerValue, '"'), "_base64\"");
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
    var readStream = s3Request.createReadStream().on('error', function (err) {
      debug('readStream error'); // If the code is PreconditionFailed and we passed an IfNoneMatch param
      // the object has not changed, so just return a 304 Not Modified response.

      if (err.code === 'NotModified' || err.code === 'PreconditionFailed' && s3Params.IfNoneMatch) {
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
      readStream = readStream.pipe(_base64Stream["default"].encode());
    }

    readStream.pipe(res);
  }

  return function (req, res, next) {
    if (req.method !== 'GET') return next(); // If a request is made to a url ending in '/', but there isn't a default file name,
    // return a list of s3 keys. Otherwise, let the getObject() method handle the request
    // E.g. if someone wants to route '/' to '/index.html' they should be able to bypass listKeys()

    console.log("req.path.slice(-1): ".concat(req.path.slice(-1)));

    if (req.path.slice(-1) === '/') {
      listKeys(req, res, next);
    } else {
      getObject(req, res, next);
    }
  };
};

var _default = S3Proxy;
exports["default"] = _default;
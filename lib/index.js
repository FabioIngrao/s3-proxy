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

function asyncGeneratorStep(gen, resolve, reject, _next, _throw, key, arg) { try { var info = gen[key](arg); var value = info.value; } catch (error) { reject(error); return; } if (info.done) { resolve(value); } else { Promise.resolve(value).then(_next, _throw); } }

function _asyncToGenerator(fn) { return function () { var self = this, args = arguments; return new Promise(function (resolve, reject) { var gen = fn.apply(self, args); function _next(value) { asyncGeneratorStep(gen, resolve, reject, _next, _throw, "next", value); } function _throw(err) { asyncGeneratorStep(gen, resolve, reject, _next, _throw, "throw", err); } _next(undefined); }); }; }

var pick = require('lodash.pick');

var trim = require('lodash.trim');

var reject = require('lodash.reject');

var assign = require('lodash.assign');

var debug = (0, _debug["default"])('s3-proxy'); // HTTP headers from the AWS request to forward along

var awsForwardHeaders = ['content-type', 'last-modified', 'etag', 'cache-control'];

var makeURL = function makeURL(_ref, isFolder, path) {
  var key = _ref.key,
      meta = _ref.meta;
  console.log("makeURL - key: ".concat(key, ", meta: ").concat(meta, ", isFolder: ").concat(isFolder, ", path: ").concat(path));
  var classNames = "icon ".concat(isFolder ? 'dir' : 'file');
  var s3path = path + key;
  var isArchive = meta && meta.ArchiveStatus === 'ARCHIVE_ACCESS';
  var isRestoreInProgress = meta && meta.Restore === 'ongoing-request="true"';
  var isRestorable = isArchive && !isRestoreInProgress;
  var isNormal = !isArchive;
  return /*#__PURE__*/_react["default"].createElement(_react["default"].Fragment, null, /*#__PURE__*/_react["default"].createElement("div", {
    className: "container"
  }, isRestorable && /*#__PURE__*/_react["default"].createElement("div", {
    className: "archie",
    title: "This file is archived, click this button to start restoring (it will take up to 5 minutes)."
  }, /*#__PURE__*/_react["default"].createElement("button", {
    className: "archive",
    type: "button",
    value: s3path
  }, /*#__PURE__*/_react["default"].createElement("svg", {
    width: "24",
    height: "24",
    fill: "#000000",
    xmlns: "http://www.w3.org/2000/svg",
    viewBox: "0 0 512.011 512.011"
  }, /*#__PURE__*/_react["default"].createElement("g", null, /*#__PURE__*/_react["default"].createElement("g", null, /*#__PURE__*/_react["default"].createElement("g", null, /*#__PURE__*/_react["default"].createElement("path", {
    d: "M447.925,0.005H64.075c-35.382,0-64.064,28.692-64.064,64.085v191.703C0.01,255.865,0,255.934,0,256.005 c0,0.071,0.01,0.14,0.011,0.211V447.92c0,35.393,28.682,64.085,64.064,64.085h383.851c35.398,0,64.085-28.687,64.085-64.085 V64.091C512.011,28.693,483.323,0.005,447.925,0.005z M64.075,42.672h383.851c11.834,0,21.419,9.585,21.419,21.419v170.581 H42.677V64.091C42.677,52.258,52.26,42.672,64.075,42.672z M447.925,469.339H64.075c-11.814,0-21.397-9.586-21.397-21.419 V277.339h426.667V447.92C469.344,459.754,459.759,469.339,447.925,469.339z"
  }), /*#__PURE__*/_react["default"].createElement("path", {
    d: "M320,320.005c-11.782,0-21.333,9.551-21.333,21.333c0,11.791-9.542,21.333-21.333,21.333h-42.667 c-11.791,0-21.333-9.542-21.333-21.333c0-11.782-9.551-21.333-21.333-21.333s-21.333,9.551-21.333,21.333 c0,35.355,28.645,64,64,64h42.667c35.355,0,64-28.645,64-64C341.333,329.557,331.782,320.005,320,320.005z"
  }), /*#__PURE__*/_react["default"].createElement("path", {
    d: "M234.667,170.672h42.667c35.355,0,64-28.645,64-64c0-11.782-9.551-21.333-21.333-21.333s-21.333,9.551-21.333,21.333 c0,11.791-9.542,21.333-21.333,21.333h-42.667c-11.791,0-21.333-9.542-21.333-21.333c0-11.782-9.551-21.333-21.333-21.333 s-21.333,9.551-21.333,21.333C170.667,142.027,199.311,170.672,234.667,170.672z"
  })))))), /*#__PURE__*/_react["default"].createElement("span", null, key)), isNormal && /*#__PURE__*/_react["default"].createElement("div", {
    className: "file"
  }, /*#__PURE__*/_react["default"].createElement("a", {
    className: classNames,
    href: key
  }, key)), isRestoreInProgress && /*#__PURE__*/_react["default"].createElement(_react["default"].Fragment, null, /*#__PURE__*/_react["default"].createElement("div", {
    className: "hourglass",
    title: "This file is being restored (it will take up to 5 minutes)."
  }, /*#__PURE__*/_react["default"].createElement("svg", {
    className: "hourglass",
    width: "20px",
    height: "24px",
    viewBox: "0 0 73 88",
    version: "1.1",
    xmlns: "http://www.w3.org/2000/svg"
  }, /*#__PURE__*/_react["default"].createElement("g", {
    id: "hourglass"
  }, /*#__PURE__*/_react["default"].createElement("path", {
    d: "M63.8761664,86 C63.9491436,84.74063 64,83.4707791 64,82.1818182 C64,65.2090455 57.5148507,50.6237818 48.20041,44 C57.5148507,37.3762182 64,22.7909545 64,5.81818182 C64,4.52922091 63.9491436,3.25937 63.8761664,2 L10.1238336,2 C10.0508564,3.25937 10,4.52922091 10,5.81818182 C10,22.7909545 16.4851493,37.3762182 25.79959,44 C16.4851493,50.6237818 10,65.2090455 10,82.1818182 C10,83.4707791 10.0508564,84.74063 10.1238336,86 L63.8761664,86 Z",
    id: "glass",
    fill: "#ECF1F6"
  }), /*#__PURE__*/_react["default"].createElement("rect", {
    id: "top-plate",
    fill: "#4D4544",
    x: "0",
    y: "0",
    width: "74",
    height: "8",
    rx: "2"
  }), /*#__PURE__*/_react["default"].createElement("rect", {
    id: "bottom-plate",
    fill: "#4D4544",
    x: "0",
    y: "80",
    width: "74",
    height: "8",
    rx: "2"
  }), /*#__PURE__*/_react["default"].createElement("g", {
    id: "top-sand",
    transform: "translate(18, 21)"
  }, /*#__PURE__*/_react["default"].createElement("clipPath", {
    id: "top-clip-path",
    fill: "white"
  }, /*#__PURE__*/_react["default"].createElement("rect", {
    x: "0",
    y: "0",
    width: "38",
    height: "21"
  })), /*#__PURE__*/_react["default"].createElement("path", {
    fill: "#F5A623",
    clipPath: "url(#top-clip-path)",
    d: "M38,0 C36.218769,7.51704545 24.818769,21 19,21 C13.418769,21 1.9,7.63636364 0,0 L38,0 Z"
  })), /*#__PURE__*/_react["default"].createElement("g", {
    id: "bottom-sand",
    transform: "translate(18, 55)"
  }, /*#__PURE__*/_react["default"].createElement("clipPath", {
    id: "bottom-clip-path",
    fill: "white"
  }, /*#__PURE__*/_react["default"].createElement("rect", {
    x: "0",
    y: "0",
    width: "38",
    height: "21"
  })), /*#__PURE__*/_react["default"].createElement("g", {
    "clip-path": "url(#bottom-clip-path)"
  }, /*#__PURE__*/_react["default"].createElement("path", {
    fill: "#F5A623",
    d: "M0,21 L38,21 C36.1,13.3636364 24.581231,0 19,0 C13.181231,0 1.781231,13.4829545 0,21 Z"
  })))))), /*#__PURE__*/_react["default"].createElement("div", null, /*#__PURE__*/_react["default"].createElement("span", null, key))), /*#__PURE__*/_react["default"].createElement("span", null, ' '), /*#__PURE__*/_react["default"].createElement("div", {
    className: "clip"
  }, /*#__PURE__*/_react["default"].createElement("button", {
    className: "btn",
    type: "button",
    "data-clipboard-text": s3path,
    title: "Click to copy S3 path to clipboard"
  }, /*#__PURE__*/_react["default"].createElement("svg", {
    width: "24",
    height: "24",
    xmlns: "http://www.w3.org/2000/svg",
    fillRule: "evenodd",
    clipRule: "evenodd"
  }, /*#__PURE__*/_react["default"].createElement("path", {
    d: "M20 24h-20v-22h3c1.229 0 2.18-1.084 3-2h8c.82.916 1.771 2 3 2h3v9h-2v-7h-4l-2 2h-3.898l-2.102-2h-4v18h16v-5h2v7zm-10-4h-6v-1h6v1zm0-2h-6v-1h6v1zm6-5h8v2h-8v3l-5-4 5-4v3zm-6 3h-6v-1h6v1zm0-2h-6v-1h6v1zm0-2h-6v-1h6v1zm0-2h-6v-1h6v1zm-1-7c0 .552.448 1 1 1s1-.448 1-1-.448-1-1-1-1 .448-1 1z"
  }))))));
};
/* istanbul ignore next */


var S3Proxy = function S3Proxy(options) {
  var s3 = new _awsSdk["default"].S3(assign((0, _awsConfig["default"])(options), pick(options, 'endpoint', 's3ForcePathStyle')));

  var generateFolderOutput = function generateFolderOutput(res, s3Params, allFolders, allFiles) {
    res.set('Content-Type', 'text/html');
    res.send("\n<html lang=\"en-US\">\n    <head>\n      <title>Nucleus -- s3://".concat(s3Params.Bucket, "</title>\n      <script\n              src=\"https://cdnjs.cloudflare.com/ajax/libs/jquery/3.7.1/jquery.min.js\"\n              integrity=\"sha512-v2CJ7UaYy4JwqLDIrZUI/4hqeoQieOmAZNXBeQyjo21dadnwR+8ZaIJVT8EE2iyI61OV8e6M8PP2/4hpQINQ/g==\"\n              crossorigin=\"anonymous\"\n              referrerpolicy=\"no-referrer\">\n      </script>\n      <script\n              src=\"https://cdnjs.cloudflare.com/ajax/libs/jqueryui/1.13.2/jquery-ui.min.js\"\n              integrity=\"sha512-57oZ/vW8ANMjR/KQ6Be9v/+/h6bq9/l3f0Oc7vn6qMqyhvPd1cvKBRWWpzu0QoneImqr2SkmO4MSqU+RpHom3Q==\"\n              crossorigin=\"anonymous\"\n              referrerpolicy=\"no-referrer\">\n  \n      </script>\n      <script\n              src=\"https://cdnjs.cloudflare.com/ajax/libs/clipboard.js/2.0.4/clipboard.min.js\"\n              integrity=\"sha384-8CYhPwYlLELodlcQV713V9ZikA3DlCVaXFDpjHfP8Z36gpddf/Vrt47XmKDsCttu\"\n              crossorigin=\"anonymous\">\n      </script>\n      <link\n              rel=\"stylesheet\"\n              href=\"https://cdnjs.cloudflare.com/ajax/libs/jqueryui/1.13.2/themes/base/jquery-ui.min.css\"\n              integrity=\"sha512-ELV+xyi8IhEApPS/pSj66+Jiw+sOT1Mqkzlh8ExXihe4zfqbWkxPRi8wptXIO9g73FSlhmquFlUOuMSoXz5IRw==\"\n              crossorigin=\"anonymous\"\n              referrerpolicy=\"no-referrer\"\n      />\n      <link\n              rel=\"stylesheet\"\n              href=\"https://cdnjs.cloudflare.com/ajax/libs/jqueryui/1.13.2/themes/base/theme.min.css\"\n              integrity=\"sha512-hbs/7O+vqWZS49DulqH1n2lVtu63t3c3MTAn0oYMINS5aT8eIAbJGDXgLt6IxDHcWyzVTgf9XyzZ9iWyVQ7mCQ==\"\n              crossorigin=\"anonymous\"\n              referrerpolicy=\"no-referrer\"\n      />\n      <script>\n        $(function () {\n          $(document)\n            .tooltip();\n        });\n  \n        function unarchive(s3Path) {\n          const msg = 'Are you sure you want to unarchive' + s3Path + '?';\n          if (!confirm(msg)) {\n            return;\n          }\n          fetch('/unarchive/' + encodeURIComponent(s3Path), {\n            method: 'GET',\n          })\n            .then(function (response) {\n              alert('Started Unarchiving ' + s3Path + '...');\n              console.info(response.json());\n            })\n            .catch(function (error) {\n              alert('Error unarchiving ' + s3Path);\n              console.info(error);\n            });\n        }\n  \n        function load() {\n          const buttons = document.getElementsByClassName('archive');\n          for (let i = 0; i < buttons.length; i++) {\n            buttons[i].addEventListener('click', function () {\n              console.info('button clicked: ', buttons[i]);\n              const s3Path = buttons[i].value;\n              unarchive(s3Path);\n            });\n          }\n          const clipboard = new ClipboardJS('.btn', {\n            target: function (trigger) {\n              if (trigger) {\n                return trigger.nextElementSibling || trigger;\n              }\n              return document.getElementById('header');\n            }\n          });\n        }\n  \n        window.onload = load;\n      </script>\n      <style>\n          div.container {\n              height: 40px;\n              font-size: 24px;\n              display: flex;\n          }\n  \n          a.icon {\n              padding-left: 32px;\n          }\n  \n          a.dir {\n              background: url(\"data:image/svg+xml;base64,PD94bWwgdmVyc2lvbj0iMS4wIiA/PjxzdmcgaGVpZ2h0PSI0OCIgdmlld0JveD0iMCAwIDQ4IDQ4IiB3aWR0aD0iNDgiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGRlZnM+PHN0eWxlPi5jbHMtMXtmaWxsOiNmNmI0NDU7fS5jbHMtMntmaWxsOiNmZWQwNDk7fS5jbHMtM3tmaWxsOiNkMGQ3ZGY7fS5jbHMtNHtmaWxsOiM0NzRjNTQ7fTwvc3R5bGU+PC9kZWZzPjx0aXRsZS8+PGcgZGF0YS1uYW1lPSI0NS1GaWxlLURvY3VtZW50LXNoYXJlIiBpZD0iXzQ1LUZpbGUtRG9jdW1lbnQtc2hhcmUiPjxwYXRoIGNsYXNzPSJjbHMtMSIgZD0iTTM5LDEzSDIyVjdIMzhhLjk3OS45NzksMCwwLDEsMSwxWiIvPjxwYXRoIGNsYXNzPSJjbHMtMiIgZD0iTTIyLDd2Nkg0M2E0LDQsMCwwLDEsNCw0VjQzYTQsNCwwLDAsMS00LDRINWE0LDQsMCwwLDEtNC00VjVTMSwxLDUsMUgxOHM0LDAsNCw0WiIvPjxjaXJjbGUgY2xhc3M9ImNscy0zIiBjeD0iMjgiIGN5PSIzOCIgcj0iMyIvPjxjaXJjbGUgY2xhc3M9ImNscy0zIiBjeD0iMjAiIGN5PSIzMCIgcj0iMyIvPjxjaXJjbGUgY2xhc3M9ImNscy0zIiBjeD0iMjgiIGN5PSIyMiIgcj0iMyIvPjxwYXRoIGNsYXNzPSJjbHMtNCIgZD0iTTQzLDEySDEyYTEsMSwwLDAsMCwwLDJINDNhMywzLDAsMCwxLDMsM1Y0M2EzLDMsMCwwLDEtMywzSDVhMywzLDAsMCwxLTMtM1Y1LjAwNkEyLjg1NCwyLjg1NCwwLDAsMSw1LDJIMThhMi44NTMsMi44NTMsMCwwLDEsMywzVjdhMSwxLDAsMCwwLDEsMUgzOFY5YTEsMSwwLDAsMCwyLDBWOGExLjk1OSwxLjk1OSwwLDAsMC0yLTJIMjNWNWE0LjgyMSw0LjgyMSwwLDAsMC01LTVINUE0LjgyMSw0LjgyMSwwLDAsMCwwLDVWNDNhNS4wMDYsNS4wMDYsMCwwLDAsNSw1SDQzYTUuMDA2LDUuMDA2LDAsMCwwLDUtNVYxN0E1LjAwNiw1LjAwNiwwLDAsMCw0MywxMloiLz48cGF0aCBjbGFzcz0iY2xzLTQiIGQ9Ik0yMi4wMTksMjYuNTY3QTMuOTQ3LDMuOTQ3LDAsMCwwLDIwLDI2YTQsNCwwLDAsMCwwLDgsMy45NDcsMy45NDcsMCwwLDAsMi4wMTktLjU2N2wyLjI3NCwyLjI3NGEuOTc3Ljk3NywwLDAsMCwuMzEuMjA2LDQuMDM1LDQuMDM1LDAsMSwwLDEuMzEtMS4zMS45NzcuOTc3LDAsMCwwLS4yMDYtLjMxbC0yLjI3NC0yLjI3NGEzLjg3OCwzLjg3OCwwLDAsMCwwLTQuMDM4bDIuMjc0LTIuMjc0YS45NzcuOTc3LDAsMCwwLC4yMDYtLjMxLDQuMDM1LDQuMDM1LDAsMSwwLTEuMzEtMS4zMS45NzcuOTc3LDAsMCwwLS4zMS4yMDZaTTI4LDM2YTIsMiwwLDEsMS0yLDJBMiwyLDAsMCwxLDI4LDM2Wk0xOCwzMGEyLDIsMCwxLDEsMiwyQTIsMiwwLDAsMSwxOCwzMFpNMjgsMjBhMiwyLDAsMSwxLTIsMkEyLDIsMCwwLDEsMjgsMjBaIi8+PC9nPjwvc3ZnPg==\") left top no-repeat;\n              background-size: contain;\n          }\n  \n          a.file {\n              background: url(\"data:image/svg+xml;base64,PD94bWwgdmVyc2lvbj0iMS4wIiA/PjxzdmcgaGVpZ2h0PSI0OCIgdmlld0JveD0iMCAwIDQ4IDQ4IiB3aWR0aD0iNDgiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGRlZnM+PHN0eWxlPi5jbHMtMXtmaWxsOiNmZmY7fS5jbHMtMntmaWxsOiNkMGQ3ZGY7fS5jbHMtM3tmaWxsOiM0NzRjNTQ7fTwvc3R5bGU+PC9kZWZzPjx0aXRsZS8+PGcgZGF0YS1uYW1lPSIxLUZpbGUtRG9jdW1lbnQiIGlkPSJfMS1GaWxlLURvY3VtZW50Ij48cGF0aCBjbGFzcz0iY2xzLTEiIGQ9Ik00MywxNFY0M2E0LDQsMCwwLDEtNCw0SDlzLTQsMC00LTRWNUE0LDQsMCwwLDEsOSwxSDMwdjlhNCw0LDAsMCwwLDQsNFoiLz48cGF0aCBjbGFzcz0iY2xzLTIiIGQ9Ik00MywxNEgzNGE0LDQsMCwwLDEtNC00VjFaIi8+PHBhdGggY2xhc3M9ImNscy0zIiBkPSJNNDMuOTIyLDEzLjYxNWEuOTk0Ljk5NCwwLDAsMC0uMjE1LS4zMjJsLTEzLTEzQTEsMSwwLDAsMCwzMCwwSDlBNS4wMDYsNS4wMDYsMCwwLDAsNCw1VjQzYTQuODIxLDQuODIxLDAsMCwwLDUsNUgzOWE1LjAwNiw1LjAwNiwwLDAsMCw1LTVWMTRBLjk4OC45ODgsMCwwLDAsNDMuOTIyLDEzLjYxNVpNMzksNDZIOS4wMDVBMi44NTMsMi44NTMsMCwwLDEsNiw0M1Y1QTMsMywwLDAsMSw5LDJIMjkuNTg2bDExLDExSDM0YTMsMywwLDAsMS0zLTNWN2ExLDEsMCwwLDAtMiwwdjNhNS4wMDYsNS4wMDYsMCwwLDAsNSw1aDhWNDNBMywzLDAsMCwxLDM5LDQ2WiIvPjxwYXRoIGNsYXNzPSJjbHMtMyIgZD0iTTM3LDI0SDExYTEsMSwwLDAsMCwwLDJIMzdhMSwxLDAsMCwwLDAtMloiLz48cGF0aCBjbGFzcz0iY2xzLTMiIGQ9Ik0zNywzMEgxMWExLDEsMCwwLDAsMCwySDM3YTEsMSwwLDAsMCwwLTJaIi8+PHBhdGggY2xhc3M9ImNscy0zIiBkPSJNMzcsMzVIMzVhMSwxLDAsMCwwLDAsMmgyYTEsMSwwLDAsMCwwLTJaIi8+PHBhdGggY2xhc3M9ImNscy0zIiBkPSJNMzEsMzVIMjlhMSwxLDAsMCwwLDAsMmgyYTEsMSwwLDAsMCwwLTJaIi8+PC9nPjwvc3ZnPg==\") left top no-repeat;\n              background-size: contain;\n          }\n  \n          button.btn {\n              background: transparent;\n              border: none;\n              cursor: pointer;\n          }\n  \n          button.archive {\n              background: transparent;\n              border: none;\n              cursor: pointer;\n              padding-left: 1px;\n          }\n  \n          svg {\n              margin-bottom: -4px;\n          }\n  \n          div.hourglass {\n              width: 24px;\n              height: 24px;\n              text-align: center;\n              margin-right: 6px;\n          }\n  \n          @keyframes top-clip {\n              0% {\n              }\n              50% {\n                  transform: translateY(21px);\n              }\n              100% {\n                  transform: translateY(21px);\n              }\n          }\n  \n          @keyframes bottom-sand-path {\n              0% {\n              }\n              50% {\n                  transform: translateY(0);\n              }\n              100% {\n                  transform: translateY(0);\n              }\n          }\n  \n          @keyframes bottom-sand-g {\n              0% {\n              }\n              85% {\n                  transform: translateY(0);\n              }\n              100% {\n                  transform: translateY(-9px);\n              }\n          }\n  \n          @keyframes hourglass-rotation {\n              50% {\n                  transform: rotateZ(0);\n              }\n              100% {\n                  transform: rotateZ(180deg);\n              }\n          }\n  \n  \n          #top-sand #top-clip-path rect,\n          #bottom-sand path,\n          #bottom-sand g,\n          svg.hourglass {\n              animation-duration: 5s;\n              animation-delay: 1s;\n              animation-iteration-count: infinite;\n          }\n  \n          #top-sand #top-clip-path rect {\n              animation-name: top-clip;\n          }\n  \n          #bottom-sand path {\n              transform: translateY(21px);\n              animation-name: bottom-sand-path;\n          }\n  \n          #bottom-sand g {\n              animation-name: bottom-sand-g;\n          }\n  \n          svg.hourglass {\n              animation-name: hourglass-rotation;\n          }\n      </style>\n  </head>\n  <body>\n    <h1 id=\"header\">Index of ").concat(s3Params.Prefix, "</h1>\n    <br/>\n    ").concat(_server["default"].renderToString(allFolders), "\n    ").concat(_server["default"].renderToString(allFiles), "\n  </body>\n</html>"));
  };

  var processList = /*#__PURE__*/function () {
    var _ref2 = _asyncToGenerator( /*#__PURE__*/regeneratorRuntime.mark(function _callee3(res, s3Params, allFiles, allFolders) {
      return regeneratorRuntime.wrap(function _callee3$(_context3) {
        while (1) {
          switch (_context3.prev = _context3.next) {
            case 0:
              s3.listObjectsV2(s3Params, /*#__PURE__*/function () {
                var _ref3 = _asyncToGenerator( /*#__PURE__*/regeneratorRuntime.mark(function _callee2(err, data) {
                  var files, folders, s3Path, createLinks, fldrs;
                  return regeneratorRuntime.wrap(function _callee2$(_context2) {
                    while (1) {
                      switch (_context2.prev = _context2.next) {
                        case 0:
                          if (!err) {
                            _context2.next = 2;
                            break;
                          }

                          return _context2.abrupt("return", res.status(400).send('Could not read S3 keys:  '.concat(s3Params.prefix, ' ').concat(s3Params.bucket)));

                        case 2:
                          // const keys = [];
                          files = [];
                          folders = {};
                          console.log("data: ".concat(JSON.stringify(data)));
                          s3Path = "s3://".concat(s3Params.Bucket, "/").concat(s3Params.Prefix);

                          createLinks = function createLinks(list, isFolder, path) {
                            return list.map(function (elem) {
                              return makeURL(elem, isFolder, path);
                            });
                          };

                          _context2.next = 9;
                          return Promise.all(data.Contents.map( /*#__PURE__*/function () {
                            var _ref4 = _asyncToGenerator( /*#__PURE__*/regeneratorRuntime.mark(function _callee(item) {
                              var key, storageClass, actualKey, parts, headObjectOutput, params;
                              return regeneratorRuntime.wrap(function _callee$(_context) {
                                while (1) {
                                  switch (_context.prev = _context.next) {
                                    case 0:
                                      key = item.Key;
                                      storageClass = item.StorageClass;
                                      console.log("item: ".concat(item)); // Chop off the prefix path

                                      console.log('key: '.concat(key));
                                      actualKey = key.substr(s3Params.Prefix.length);
                                      parts = actualKey.split('/');

                                      if (!(parts.length > 1)) {
                                        _context.next = 10;
                                        break;
                                      }

                                      // non empty folder
                                      folders[parts[0]] = true;
                                      _context.next = 24;
                                      break;

                                    case 10:
                                      if (!parts[0]) {
                                        _context.next = 24;
                                        break;
                                      }

                                      if (!(storageClass === 'INTELLIGENT_TIERING')) {
                                        _context.next = 23;
                                        break;
                                      }

                                      _context.prev = 12;
                                      params = {
                                        Bucket: s3Params.Bucket,
                                        Key: key
                                      };
                                      _context.next = 16;
                                      return s3.headObject(params).promise();

                                    case 16:
                                      headObjectOutput = _context.sent;
                                      console.log("headObjectOutput: ".concat(JSON.stringify(headObjectOutput)));
                                      _context.next = 23;
                                      break;

                                    case 20:
                                      _context.prev = 20;
                                      _context.t0 = _context["catch"](12);
                                      console.log("err: ".concat(_context.t0));

                                    case 23:
                                      files.push({
                                        key: parts[0],
                                        meta: headObjectOutput
                                      });

                                    case 24:
                                    case "end":
                                      return _context.stop();
                                  }
                                }
                              }, _callee, null, [[12, 20]]);
                            }));

                            return function (_x7) {
                              return _ref4.apply(this, arguments);
                            };
                          }()));

                        case 9:
                          data.CommonPrefixes.forEach(function (item) {
                            var folderName = item.Prefix.replace(s3Params.Prefix, '');
                            folders[folderName] = true;
                          });
                          console.log("Files: ".concat(JSON.stringify(files)));
                          console.log("Folders: ".concat(JSON.stringify(folders)));
                          fldrs = [];
                          Object.keys(folders).forEach(function (folder) {
                            fldrs.push({
                              key: folder,
                              meta: null
                            });
                          });
                          allFolders.push(createLinks(fldrs, true, s3Path));
                          allFiles.push(createLinks(files, false, s3Path));

                          if (!data.IsTruncated) {
                            _context2.next = 22;
                            break;
                          }

                          // Set Marker to last returned key
                          s3Params.ContinuationToken = data.NextContinuationToken;
                          _context2.next = 20;
                          return processList(res, s3Params, allFiles, allFolders);

                        case 20:
                          _context2.next = 23;
                          break;

                        case 22:
                          generateFolderOutput(res, s3Params, allFolders, allFiles);

                        case 23:
                        case "end":
                          return _context2.stop();
                      }
                    }
                  }, _callee2);
                }));

                return function (_x5, _x6) {
                  return _ref3.apply(this, arguments);
                };
              }());

            case 1:
            case "end":
              return _context3.stop();
          }
        }
      }, _callee3);
    }));

    return function processList(_x, _x2, _x3, _x4) {
      return _ref2.apply(this, arguments);
    };
  }();

  var listKeys = /*#__PURE__*/function () {
    var _ref5 = _asyncToGenerator( /*#__PURE__*/regeneratorRuntime.mark(function _callee4(req, res, next) {
      var decodedURL, folderPath, parts, Bucket, s3Params, allFiles, allFolders;
      return regeneratorRuntime.wrap(function _callee4$(_context4) {
        while (1) {
          switch (_context4.prev = _context4.next) {
            case 0:
              console.log('listKeys');
              decodedURL = decodeURIComponent(req.originalUrl);
              folderPath = decodedURL.substr(req.baseUrl.length);
              parts = folderPath.split('/');

              if (!(parts.length < 3)) {
                _context4.next = 6;
                break;
              }

              return _context4.abrupt("return", res.status(400).send("Invalid path: ".concat(folderPath)));

            case 6:
              Bucket = parts[2];
              folderPath = parts.splice(3, parts.length).join('/');
              s3Params = {
                Bucket: Bucket,
                Prefix: options.prefix ? (0, _urlJoin["default"])(options.prefix, folderPath) : folderPath,
                Delimiter: '/',
                MaxKeys: 300
              };
              console.log("listKeys - s3Params: ".concat(JSON.stringify(s3Params)));
              debug('list s3 keys at', s3Params.Prefix);
              allFiles = [];
              allFolders = [];
              _context4.next = 15;
              return processList(res, s3Params, allFiles, allFolders);

            case 15:
            case "end":
              return _context4.stop();
          }
        }
      }, _callee4);
    }));

    return function listKeys(_x8, _x9, _x10) {
      return _ref5.apply(this, arguments);
    };
  }(); // The url will have the format: <host>/s3/bucket-name/key


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

  return /*#__PURE__*/function () {
    var _ref6 = _asyncToGenerator( /*#__PURE__*/regeneratorRuntime.mark(function _callee5(req, res, next) {
      return regeneratorRuntime.wrap(function _callee5$(_context5) {
        while (1) {
          switch (_context5.prev = _context5.next) {
            case 0:
              if (!(req.method !== 'GET')) {
                _context5.next = 2;
                break;
              }

              return _context5.abrupt("return", next());

            case 2:
              // If a request is made to a url ending in '/', but there isn't a default file name,
              // return a list of s3 keys. Otherwise, let the getObject() method handle the request
              // E.g. if someone wants to route '/' to '/index.html' they should be able to bypass listKeys()
              console.log("req.path.slice(-1): ".concat(req.path.slice(-1)));

              if (!(req.path.slice(-1) === '/')) {
                _context5.next = 8;
                break;
              }

              _context5.next = 6;
              return listKeys(req, res, next);

            case 6:
              _context5.next = 9;
              break;

            case 8:
              getObject(req, res, next);

            case 9:
            case "end":
              return _context5.stop();
          }
        }
      }, _callee5);
    }));

    return function (_x11, _x12, _x13) {
      return _ref6.apply(this, arguments);
    };
  }();
};

var _default = S3Proxy;
exports["default"] = _default;
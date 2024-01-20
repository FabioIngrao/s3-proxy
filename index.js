/* eslint-disable */
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
const reject = require('lodash.reject');
const assign = require('lodash.assign');

const debug = debug0('s3-proxy');

// HTTP headers from the AWS request to forward along
const awsForwardHeaders = ['content-type', 'last-modified', 'etag', 'cache-control'];

const makeURL = ({
                     key,
                     meta
                 }, isFolder, path) => {
    console.log(`makeURL - key: ${key}, meta: ${meta}, isFolder: ${isFolder}, path: ${path}`);
    const classNames = `icon ${isFolder ? 'dir' : 'file'}`;
    const s3path = path + key;
    const isArchive = meta && meta.ArchiveStatus === 'ARCHIVE_ACCESS';
    const isRestoreInProgress = meta && meta.Restore === 'ongoing-request="true"';
    const isRestorable = isArchive && !isRestoreInProgress;
    const isNormal = !isArchive;

    return (
        <>
            <div className="container">
                {
                    isRestorable &&
                    <div
                        className="archie"
                        title="This file is archived, click this button to start restoring (it will take up to 5 minutes)."
                    >
                        <button className="archive" type="button" value={s3path}>
                            <svg width="24" height="24" fill="#000000" xmlns="http://www.w3.org/2000/svg"
                                 viewBox="0 0 512.011 512.011">
                                <g>
                                    <g>
                                        <g>
                                            <path d="M447.925,0.005H64.075c-35.382,0-64.064,28.692-64.064,64.085v191.703C0.01,255.865,0,255.934,0,256.005
                        c0,0.071,0.01,0.14,0.011,0.211V447.92c0,35.393,28.682,64.085,64.064,64.085h383.851c35.398,0,64.085-28.687,64.085-64.085
                        V64.091C512.011,28.693,483.323,0.005,447.925,0.005z M64.075,42.672h383.851c11.834,0,21.419,9.585,21.419,21.419v170.581
                        H42.677V64.091C42.677,52.258,52.26,42.672,64.075,42.672z M447.925,469.339H64.075c-11.814,0-21.397-9.586-21.397-21.419
                        V277.339h426.667V447.92C469.344,459.754,459.759,469.339,447.925,469.339z"/>
                                            <path d="M320,320.005c-11.782,0-21.333,9.551-21.333,21.333c0,11.791-9.542,21.333-21.333,21.333h-42.667
                        c-11.791,0-21.333-9.542-21.333-21.333c0-11.782-9.551-21.333-21.333-21.333s-21.333,9.551-21.333,21.333
                        c0,35.355,28.645,64,64,64h42.667c35.355,0,64-28.645,64-64C341.333,329.557,331.782,320.005,320,320.005z"/>
                                            <path d="M234.667,170.672h42.667c35.355,0,64-28.645,64-64c0-11.782-9.551-21.333-21.333-21.333s-21.333,9.551-21.333,21.333
                        c0,11.791-9.542,21.333-21.333,21.333h-42.667c-11.791,0-21.333-9.542-21.333-21.333c0-11.782-9.551-21.333-21.333-21.333
                        s-21.333,9.551-21.333,21.333C170.667,142.027,199.311,170.672,234.667,170.672z"/>
                                        </g>
                                    </g>
                                </g>
                            </svg>
                        </button>
                        <span>{key}</span>
                    </div>
                }
                {
                    isNormal &&
                    <div className="file">
                        <a className={classNames} href={key}>
                            {key}
                        </a>
                    </div>
                }
                {
                    isRestoreInProgress &&
                    <>
                        <div
                            className="hourglass"
                            title="This file is being restored (it will take up to 5 minutes)."
                        >
                            <svg className="hourglass" width="20px" height="24px" viewBox="0 0 73 88" version="1.1"
                                 xmlns="http://www.w3.org/2000/svg">
                                <g id="hourglass">
                                    <path
                                        d="M63.8761664,86 C63.9491436,84.74063 64,83.4707791 64,82.1818182 C64,65.2090455 57.5148507,50.6237818 48.20041,44 C57.5148507,37.3762182 64,22.7909545 64,5.81818182 C64,4.52922091 63.9491436,3.25937 63.8761664,2 L10.1238336,2 C10.0508564,3.25937 10,4.52922091 10,5.81818182 C10,22.7909545 16.4851493,37.3762182 25.79959,44 C16.4851493,50.6237818 10,65.2090455 10,82.1818182 C10,83.4707791 10.0508564,84.74063 10.1238336,86 L63.8761664,86 Z"
                                        id="glass" fill="#ECF1F6">
                                    </path>
                                    <rect id="top-plate" fill="#4D4544" x="0" y="0" width="74" height="8" rx="2"></rect>
                                    <rect id="bottom-plate" fill="#4D4544" x="0" y="80" width="74" height="8" rx="2"></rect>

                                    <g id="top-sand" transform="translate(18, 21)">
                                        <clipPath id="top-clip-path" fill="white">
                                            <rect x="0" y="0" width="38" height="21"></rect>
                                        </clipPath>

                                        <path fill="#F5A623" clipPath="url(#top-clip-path)"
                                              d="M38,0 C36.218769,7.51704545 24.818769,21 19,21 C13.418769,21 1.9,7.63636364 0,0 L38,0 Z"></path>
                                    </g>

                                    <g id="bottom-sand" transform="translate(18, 55)">
                                        <clipPath id="bottom-clip-path" fill="white">
                                            <rect x="0" y="0" width="38" height="21"></rect>
                                        </clipPath>

                                        <g clip-path="url(#bottom-clip-path)">
                                            <path fill="#F5A623"
                                                  d="M0,21 L38,21 C36.1,13.3636364 24.581231,0 19,0 C13.181231,0 1.781231,13.4829545 0,21 Z"></path>
                                        </g>
                                    </g>
                                </g>
                            </svg>
                        </div>
                        <div>
                            <span>{key}</span>
                        </div>
                    </>
                }
                <span>{' '}</span>
                <div className="clip">
                    <button
                        className="btn"
                        type="button"
                        data-clipboard-text={s3path}
                        title="Click to copy S3 path to clipboard"
                    >
                        <svg width="24" height="24" xmlns="http://www.w3.org/2000/svg" fillRule="evenodd" clipRule="evenodd">
                            <path
                                d="M20 24h-20v-22h3c1.229 0 2.18-1.084 3-2h8c.82.916 1.771 2 3 2h3v9h-2v-7h-4l-2 2h-3.898l-2.102-2h-4v18h16v-5h2v7zm-10-4h-6v-1h6v1zm0-2h-6v-1h6v1zm6-5h8v2h-8v3l-5-4 5-4v3zm-6 3h-6v-1h6v1zm0-2h-6v-1h6v1zm0-2h-6v-1h6v1zm0-2h-6v-1h6v1zm-1-7c0 .552.448 1 1 1s1-.448 1-1-.448-1-1-1-1 .448-1 1z"/>
                        </svg>
                    </button>
                </div>
            </div>
        </>);
};

/* istanbul ignore next */
const S3Proxy = (options) => {
    const s3 = new AWS.S3(assign(awsConfig(options),
        pick(options, 'endpoint', 's3ForcePathStyle')));

    const generateFolderOutput = (res, s3Params, allFolders, allFiles) => {
        res.set('Content-Type', 'text/html');
        res.send(`
<html lang="en-US">
    <head>
      <title>Nucleus -- s3://${s3Params.Bucket}</title>
      <script
              src="https://cdnjs.cloudflare.com/ajax/libs/jquery/3.7.1/jquery.min.js"
              integrity="sha512-v2CJ7UaYy4JwqLDIrZUI/4hqeoQieOmAZNXBeQyjo21dadnwR+8ZaIJVT8EE2iyI61OV8e6M8PP2/4hpQINQ/g=="
              crossorigin="anonymous"
              referrerpolicy="no-referrer">
      </script>
      <script
              src="https://cdnjs.cloudflare.com/ajax/libs/jqueryui/1.13.2/jquery-ui.min.js"
              integrity="sha512-57oZ/vW8ANMjR/KQ6Be9v/+/h6bq9/l3f0Oc7vn6qMqyhvPd1cvKBRWWpzu0QoneImqr2SkmO4MSqU+RpHom3Q=="
              crossorigin="anonymous"
              referrerpolicy="no-referrer">
  
      </script>
      <script
              src="https://cdnjs.cloudflare.com/ajax/libs/clipboard.js/2.0.4/clipboard.min.js"
              integrity="sha384-8CYhPwYlLELodlcQV713V9ZikA3DlCVaXFDpjHfP8Z36gpddf/Vrt47XmKDsCttu"
              crossorigin="anonymous">
      </script>
      <link
              rel="stylesheet"
              href="https://cdnjs.cloudflare.com/ajax/libs/jqueryui/1.13.2/themes/base/jquery-ui.min.css"
              integrity="sha512-ELV+xyi8IhEApPS/pSj66+Jiw+sOT1Mqkzlh8ExXihe4zfqbWkxPRi8wptXIO9g73FSlhmquFlUOuMSoXz5IRw=="
              crossorigin="anonymous"
              referrerpolicy="no-referrer"
      />
      <link
              rel="stylesheet"
              href="https://cdnjs.cloudflare.com/ajax/libs/jqueryui/1.13.2/themes/base/theme.min.css"
              integrity="sha512-hbs/7O+vqWZS49DulqH1n2lVtu63t3c3MTAn0oYMINS5aT8eIAbJGDXgLt6IxDHcWyzVTgf9XyzZ9iWyVQ7mCQ=="
              crossorigin="anonymous"
              referrerpolicy="no-referrer"
      />
      <script>
        $(function () {
          $(document)
            .tooltip();
        });
  
        function unarchive(s3Path) {
          const msg = 'Are you sure you want to unarchive' + s3Path + '?';
          if (!confirm(msg)) {
            return;
          }
          fetch('/unarchive/' + encodeURIComponent(s3Path), {
            method: 'GET',
          })
            .then(function (response) {
              alert('Started Unarchiving ' + s3Path + '...');
              console.info(response.json());
            })
            .catch(function (error) {
              alert('Error unarchiving ' + s3Path);
              console.info(error);
            });
        }
  
        function load() {
          const buttons = document.getElementsByClassName('archive');
          for (let i = 0; i < buttons.length; i++) {
            buttons[i].addEventListener('click', function () {
              console.info('button clicked: ', buttons[i]);
              const s3Path = buttons[i].value;
              unarchive(s3Path);
            });
          }
          const clipboard = new ClipboardJS('.btn', {
            target: function (trigger) {
              if (trigger) {
                return trigger.nextElementSibling || trigger;
              }
              return document.getElementById('header');
            }
          });
        }
  
        window.onload = load;
      </script>
      <style>
          div.container {
              height: 40px;
              font-size: 24px;
              display: flex;
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
  
          button.btn {
              background: transparent;
              border: none;
              cursor: pointer;
          }
  
          button.archive {
              background: transparent;
              border: none;
              cursor: pointer;
              padding-left: 1px;
          }
  
          svg {
              margin-bottom: -4px;
          }
  
          div.hourglass {
              width: 24px;
              height: 24px;
              text-align: center;
              margin-right: 6px;
          }
  
          @keyframes top-clip {
              0% {
              }
              50% {
                  transform: translateY(21px);
              }
              100% {
                  transform: translateY(21px);
              }
          }
  
          @keyframes bottom-sand-path {
              0% {
              }
              50% {
                  transform: translateY(0);
              }
              100% {
                  transform: translateY(0);
              }
          }
  
          @keyframes bottom-sand-g {
              0% {
              }
              85% {
                  transform: translateY(0);
              }
              100% {
                  transform: translateY(-9px);
              }
          }
  
          @keyframes hourglass-rotation {
              50% {
                  transform: rotateZ(0);
              }
              100% {
                  transform: rotateZ(180deg);
              }
          }
  
  
          #top-sand #top-clip-path rect,
          #bottom-sand path,
          #bottom-sand g,
          svg.hourglass {
              animation-duration: 5s;
              animation-delay: 1s;
              animation-iteration-count: infinite;
          }
  
          #top-sand #top-clip-path rect {
              animation-name: top-clip;
          }
  
          #bottom-sand path {
              transform: translateY(21px);
              animation-name: bottom-sand-path;
          }
  
          #bottom-sand g {
              animation-name: bottom-sand-g;
          }
  
          svg.hourglass {
              animation-name: hourglass-rotation;
          }
      </style>
  </head>
  <body>
    <h1 id="header">Index of ${s3Params.Prefix}</h1>
    <br/>
    ${ReactDOM.renderToString(allFolders)}
    ${ReactDOM.renderToString(allFiles)}
  </body>
</html>`);

    };

    const processList = async (res, s3Params, allFiles, allFolders) => {
        s3.listObjectsV2(s3Params, async (err, data) => {
            if (err) {
                return res.status(400)
                    .send('Could not read S3 keys:  '.concat(s3Params.prefix, ' ')
                        .concat(s3Params.bucket));
            }

            // const keys = [];
            const files = [];
            const folders = {};
            console.log(`data: ${JSON.stringify(data)}`);
            const s3Path = `s3://${s3Params.Bucket}/${s3Params.Prefix}`;
            const createLinks = (list, isFolder, path) => list.map((elem) => makeURL(elem, isFolder, path));

            await Promise.all(data.Contents.map(async (item) => {
                const key = item.Key;
                const storageClass = item.StorageClass;
                console.log(`item: ${item}`);
                // Chop off the prefix path
                console.log('key: '.concat(key));
                var actualKey = key.substr(s3Params.Prefix.length);
                var parts = actualKey.split('/');

                if (parts.length > 1) {
                    // non empty folder
                    folders[parts[0]] = true;
                } else if (parts[0]) {
                    let headObjectOutput;
                    if (storageClass === 'INTELLIGENT_TIERING') {
                        try {
                            const params = {
                                Bucket: s3Params.Bucket,
                                Key: key
                            };
                            headObjectOutput = await s3.headObject(params)
                                .promise();
                            console.log(`headObjectOutput: ${JSON.stringify(headObjectOutput)}`);
                        } catch (err) {
                            console.log(`err: ${err}`);
                        }
                    }
                    files.push({
                        key: parts[0],
                        meta: headObjectOutput,
                    });
                }
            }));
            data.CommonPrefixes.forEach((item) => {
                const folderName = item.Prefix.replace(s3Params.Prefix, '');
                folders[folderName] = true;
            });

            console.log(`Files: ${JSON.stringify(files)}`);
            console.log(`Folders: ${JSON.stringify(folders)}`);
            const fldrs = [];
            Object.keys(folders)
                .forEach((folder) => {
                    fldrs.push({
                        key: folder,
                        meta: null,
                    });
                });
            allFolders.push(createLinks(fldrs, true, s3Path));
            allFiles.push(createLinks(files, false, s3Path));
            if (data.IsTruncated) {
                // Set Marker to last returned key
                s3Params.ContinuationToken = data.NextContinuationToken;
                await processList(res, s3Params, allFiles, allFolders);
            } else {
                generateFolderOutput(res, s3Params, allFolders, allFiles);
            }
        });

    };

    const listKeys = async (req, res, next) => {
        console.log('listKeys');
        const decodedURL = decodeURIComponent(req.originalUrl);
        let folderPath = decodedURL.substr(req.baseUrl.length);
        const parts = folderPath.split('/');
        if (parts.length < 3) {
            return res.status(400)
                .send(`Invalid path: ${folderPath}`);
        }
        const Bucket = parts[2];
        folderPath = parts.splice(3, parts.length)
            .join('/');

        const s3Params = {
            Bucket,
            Prefix: options.prefix ? urljoin(options.prefix, folderPath) : folderPath,
            Delimiter: '/',
            MaxKeys: 300,
        };
        console.log(`listKeys - s3Params: ${JSON.stringify(s3Params)}`);
        debug('list s3 keys at', s3Params.Prefix);
        const allFiles = [];
        const allFolders = [];
        await processList(res, s3Params, allFiles, allFolders);
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
        s3Key = reject(s3Key.split('/'), (segment) => segment.slice(0, 2) === '--')
            .join('/');

        const parts = s3Key.split('/');
        if (parts.length < 3) {
            return res.status(400)
                .send(`Invalid path: ${s3Key}`);
        }
        const Bucket = parts[1];
        s3Key = parts.splice(2, parts.length)
            .join('/');

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
                    return res.status(304)
                        .end();
                }
                if (err.code === 'NoSuchKey') {
                    return res.status(404)
                        .send('Missing S3 Key');
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

    return async (req, res, next) => {
        if (req.method !== 'GET') return next();

        // If a request is made to a url ending in '/', but there isn't a default file name,
        // return a list of s3 keys. Otherwise, let the getObject() method handle the request
        // E.g. if someone wants to route '/' to '/index.html' they should be able to bypass listKeys()
        console.log(`req.path.slice(-1): ${req.path.slice(-1)}`);
        if (req.path.slice(-1) === '/') {
            await listKeys(req, res, next);
        } else {
            getObject(req, res, next);
        }
    };
};

export default S3Proxy;

// ==UserScript==
// @name         Discussed on Hacker News
// @namespace    http://news.ycombinator.com
// @version      2025-01-17
// @description  Find comments related to current URL, go to most commented.
// @author       Charles F.
// @match        *://*/*
// @noframes
// @icon         https://www.google.com/s2/favicons?sz=64&domain=ycombinator.com
// @grant        GM.xmlHttpRequest
// @grant        GM_getValue
// @grant        GM_setValue
// ==/UserScript==

(function() {
    'use strict';

    const alreadyChecked = [];
    const CONF_KEY = "dhn.ignored";
    const ignored = JSON.parse(GM_getValue(CONF_KEY) || "[\"news.ycombinator.com\"]");

    function log(message) {
        console.log(`DHN`, window.location.href, message);
    }

    async function startAsync() {
        if (ignored.indexOf(window.location.host) >= 0) {
            log(`${window.location.host} is ignored, not searching`);
            return;
        } else {
            log(`Checking HN for comments`);
            await sleepAsync(500);
            await processAsync();
        }
    }

    async function processAsync() {
        const ui = inject();
        setInterval(async () => await refreshAsync(ui), 1000);
    }

    async function refreshAsync(ui) {
        if (alreadyChecked.indexOf(window.location.href) >= 0) {
            return;
        }
        alreadyChecked.push(window.location.href);
        const results = await searchHN();
        const commentCount = results.reduce((total, hit) => hit.num_comments + total, 0);
        ui.setComments(commentCount);
        log(`Found ${commentCount} comments`);
        if (results.length > 1) {
            // More than one, search
            ui.setSearchUrl(window.location.href);
        } else if (results.length > 0) {
            // Just one, go direct to conversation
            ui.setId(results[0].story_id);
        } else {
            log(`There weren't any comments on HN, hiding the element`);
            setTimeout(()=>ui.hide(), 2500);
        }
    }

    function addToIgnore() {
        if (!confirm(`Add ${window.location.host} to ignored list?`)) {
            return false;
        }
        log(`Add ${window.location.host} to ignored list`);
        ignored.push(window.location.host);
        GM_setValue(CONF_KEY, JSON.stringify(ignored));
        return true;
    }

    function inject() {
        const zIndex = getHighestZIndex();
        const container = document.createElement("div");
        container.style.top = 0;
        container.style.left = 0;
        container.style.zIndex = zIndex + 1;
        container.style.width = "100%";
        container.style.position = "absolute";
        container.style.pointerEvents = "none";
        container.id = "hn-comments";
        document.getElementsByTagName("body")[0].appendChild(container);

        const div = document.createElement("div");
        container.appendChild(div);
        div.style.width = "90px";
        div.style.height = "20px";
        div.style.backgroundColor = "white";
        div.style.color = "black";
        div.style.fontSize = "10px";
        div.style.textAlign = "center";
        div.style.opacity = "50%";
        div.style.borderRadius = "3px";
        div.style.margin = "auto";

        const closeButton = document.createElement("span");
        closeButton.innerHTML = "&cross;";
        closeButton.style.color = "orange";
        closeButton.style.pointerEvents = "auto";
        closeButton.style.cursor = "pointer";
        closeButton.onclick = hide
        closeButton.oncontextmenu = (e) => {
            e.preventDefault();
            if (addToIgnore()) {
                hide();
            }
            return false;
        };
        div.appendChild(closeButton);
        div.appendChild(document.createTextNode(" "));

        const span = document.createElement("span");
        span.innerHTML = "Checking HN...";
        div.appendChild(span);

        div.appendChild(document.createTextNode(" "));

        const link = document.createElement("a");
        link.innerHTML = "&#10095;";
        link.style.color = "orange";
        link.style.fontWeight = "bold";
        link.style.textDecoration = "none";
        link.style.pointerEvents = "auto";
        link.style.display = "none";
        div.appendChild(link);

        function setComments(commentCount){
            span.innerHTML = `${commentCount} comments`
        };

        function setId(id) {
            link.href = `https://news.ycombinator.com/item?id=${id}`;
            link.style.display = "inline";
        };

        function setSearchUrl(url) {
            link.href = `https://hn.algolia.com/?q=${url}`;
            link.style.display = "inline";
        };

        function hide() {
            container.parentElement.removeChild(container);
        }


        const controlObject = { setComments, setId, hide, setSearchUrl };
        return controlObject;
    }

    async function searchHN() {
        const search = encodeURIComponent(window.location.href);
        const url = `http://hn.algolia.com/api/v1/search?query=${search}&restrictSearchableAttributes=url`;

        const res = await gmFetch(url);
        const json = await res.json();
        return json.hits
            .filter(c => c.num_comments > 0)
            .sort((a,b) => a.num_comments - b.num_comments);
    }

    function gmFetch(url, options = {}) {
        return new Promise((resolve, reject) => {
            GM.xmlHttpRequest({
                method: options.method || 'GET',
                url: url,
                data: options.body,
                headers: options.headers || {},
                responseType: options.responseType || 'json',
                onload: (response) => {
                    resolve({
                        ok: response.status >= 200 && response.status < 300,
                        status: response.status,
                        statusText: response.statusText,
                        headers: parseHeaders(response.responseHeaders),
                        json: () => Promise.resolve(JSON.parse(response.responseText)),
                        text: () => Promise.resolve(response.responseText),
                        blob: () => Promise.resolve(new Blob([response.response])),
                    });
                },
                onerror: (error) => {
                    reject(new Error('Network error'));
                }
            });
        });

        function parseHeaders(headerString) {
            const headers = new Headers();
            const pairs = headerString.trim().split('\n');
            pairs.forEach(pair => {
                const [key, value] = pair.split(': ');
                headers.append(key, value);
            });
            return headers;
        }
    }

    function getHighestZIndex(selector = 'body *') {
        const elements = Array.from(document.querySelectorAll(selector));
        let highestZIndex = 0;
        let elementWithHighestZIndex = null;

        elements.forEach(element => {
            const zIndex = parseInt(window.getComputedStyle(element).zIndex);
            if (!isNaN(zIndex) && zIndex > highestZIndex) {
                highestZIndex = zIndex;
                elementWithHighestZIndex = element;
            }
        });

        return highestZIndex;
    }

    async function sleepAsync(timeMs) { return new Promise(resolve => setTimeout(resolve, timeMs)); }

    startAsync().then();
})();

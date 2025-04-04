// ==UserScript==
// @name         Planner improved timeline
// @namespace    http://tampermonkey.net/
// @version      2025-04-03
// @description  Adds colors and labels to the timeline in Microsoft Planner
// @author       Charles Feval
// @match        https://planner.cloud.microsoft/webui/premiumplan/*
// @icon         https://www.google.com/s2/favicons?sz=64&domain=cloud.microsoft
// @grant        none
// ==/UserScript==

(function() {
    'use strict';

    const isDebugging = false;
    var log = (...args) => {
        console.log(`[PLANNER COLORS][INFO]  `, ...args);
    };

    var debug = (...args) => {
        if (!isDebugging) {
            return;
        }
        console.log(`[PLANNER COLORS][DEBUG] `, ...args);
    };

    var tasks = {};
    var buckets = [];
    var labels = [];
    var labelassociations = [];
    let token;
    const colorPerBucket = {};
    const colorPerLabel = {};
    const officialColors = [
        [255, 255, 255],
        [251, 221, 240],
        [233, 199, 205],
        [245, 237, 206],
        [219, 235, 199],
        [208, 231, 248],
        [216, 204, 231],
        [241, 217, 204],
        [229, 242, 211],
        [194, 231, 231],
        [229, 228, 227],
        [234, 238, 239],
        [226, 209, 203],
        [197, 15, 31],
        [255, 0, 0],
        [255, 140, 0],
        [234, 163, 0],
        [19, 161, 14],
        [11, 106, 11],
        [0, 183, 195],
        [52, 136, 200],
        [0, 57, 102],
        [113, 96, 235],
        [119, 0, 77],
        [122, 117, 116],
        [57, 65, 70],
    ];
    const pastelColors = [
        "#FFB3BA", // Soft Pink
        "#FFDFBA", // Peach
        "#FFFFBA", // Light Yellow
        "#BAFFC9", // Mint Green
        "#BAE1FF", // Light Blue
        "#D7BDE2", // Lavender
        "#FAD2E1", // Blush Pink
        "#B5EAD7", // Aqua Green
        "#C7CEEA", // Periwinkle
        "#FFD3B6",  // Warm Apricot
    ];
    const accentColors = [
        "#D81B60", // Deep Magenta for Soft Pink
        "#FF6700", // Bold Orange for Peach
        "#CDA500", // Goldenrod for Light Yellow
        "#00875A", // Deep Teal for Mint Green
        "#0056B3", // Royal Blue for Light Blue
        "#6A0DAD", // Rich Purple for Lavender
        "#B22222", // Firebrick Red for Blush Pink
        "#00796B", // Dark Cyan for Aqua Green
        "#4B0082", // Indigo for Periwinkle
        "#A45A00",  // Warm Brown for Warm Apricot
    ];

    // Overriding request to intercept tasks and labels
    (function() {
    const originalOpen = XMLHttpRequest.prototype.open;
    const originalSetHeader = XMLHttpRequest.prototype.setRequestHeader;

        // Steal token for later use
        XMLHttpRequest.prototype.setRequestHeader = function(header, value, ... rest) {
            if (this.responseURL?.indexOf(`/tasks/?$select=`) && header === "Authorization") {
                token = value;
            }
            return originalSetHeader.apply(this, [header, value, ...rest]);
        }

        XMLHttpRequest.prototype.open = function(method, url, ...rest) {

            let processor = url.indexOf(`/tasks/?$select=`) >= 0 ? updateTasksAsync
            : url.endsWith(`/buckets`) ? updateBucketsAsync
            : url.endsWith(`/labels`) ? updateLabelsAsync
            : url.endsWith(`/labelassociations`) ? updateLabelAssociationsAsync
            : undefined;
            if (processor) {
                this.addEventListener('load', function() {
                    const obj = JSON.parse(this.responseText);
                    processor(obj).then();
                });
            }
            return originalOpen.apply(this, [method, url, ...rest]);
        };
    })();


    async function updateTasksAsync(t) {
        tasks = {};
        t.forEach(task => { tasks[task.id] = { ...task, labels: [] }});
        log(`Updated tasks: `, tasks);
        await runAsync();
    }

    async function updateBucketsAsync(b) {
        buckets = {};
        b.forEach(bucket => { buckets[bucket.id] = bucket});
        log(`Updated buckets: `, buckets);
        await runAsync();
    }

    async function updateLabelsAsync(b) {
        labels = {};
        b.forEach(label => { labels[label.id] = label});

        log(`Updated labels: `, labels);
        await runAsync();
    }

    async function updateLabelAssociationsAsync(b) {
        labelassociations = b;
        log(`Updated label associations: `, b);
        await runAsync();
    }

    async function runAsync() {
        // We're not finished loading yet.
        if (Object.keys(tasks).length === 0
            || Object.keys(buckets).length === 0
            || Object.keys(labels).length === 0
            || labelassociations.length === 0) {
            return;
        }

        log(`Finished loading`);
        labelassociations.forEach(assoc => {
            const label = labels[assoc.labelId];
            const task = tasks[assoc.taskId];
            if (label && task) {
                task.labels.push(label);
            }
        });

        setInterval(updateUI, 500);
    }

    function getOfficialColor(colorId) {
        const background = officialColors[colorId];
        if (!background) {
            return {
                background: pastelColors.shift(),
                accent: accentColors.shift()
            }
        }
        const accent = background.map(color => Math.max(0, color - 20));
        const text = background.map(color => Math.max(0, color - 80));
        return {
            background: `rgb(${background[0]}, ${background[1]}, ${background[2]})`,
            accent: `rgb(${accent[0]}, ${accent[1]}, ${accent[2]})`,
            text: `rgb(${text[0]}, ${text[1]}, ${text[2]})`,
        };
    }

    function getColorPerBucketId(bucketId) {
        if (!colorPerBucket[bucketId]) {
            const bucket = buckets[bucketId];
            if (bucket && bucket.color < officialColors.length) {
                const background = officialColors[bucket.color];
                const accent = background.map(color => Math.max(0, color - 20));
                colorPerBucket[bucketId] = {
                    background: `rgb(${background[0]}, ${background[1]}, ${background[2]})`,
                    accent: `rgb(${accent[0]}, ${accent[1]}, ${accent[2]})`
                };
            } else {
                colorPerBucket[bucketId] = {
                    background: pastelColors.shift(),
                    accent: accentColors.shift()
                };
            }
        }
        return colorPerBucket[bucketId];
    }

    async function updateUI() {
        colorTimeline();
        addLabels();
    }

    function colorTimeline() {
        Object.values(tasks).forEach(task => {
            const color = getColorPerBucketId(task.bucketId);
            const taskBar = document.querySelector(`div.gantt-chart-task-bar[data-key="${task.id}"]`);
            if (taskBar) {
                taskBar.style.borderColor = color.accent;
                taskBar.style.backgroundColor = color.background;
                const progressBars = taskBar.getElementsByClassName("task-bar-progress");
                if (progressBars) {
                    const progressBar = progressBars[0];
                    progressBar.style.backgroundColor = color.accent;
                }
            }
        });
    }

    function addLabels() {
        const scheduleGridElts = document.getElementsByClassName("ScheduleGrid");
        if (!scheduleGridElts) {
            debug(`labels: not on timeline`);
            return;
        }
        const scheduleGrid = scheduleGridElts[0];
        let rows = [...scheduleGrid.getElementsByClassName("grid-row")];

        log(`Adding labels`);
        rows.forEach(row => {
            if (row.getElementsByClassName("CF_labels").length) {
                return;
            }
            const nameCell = row.querySelector('[id$="_name"]');
            if (!nameCell) {
                debug(`Row with no name cell`);
                return;
            }
            const name = nameCell.innerText;
            const task = Object.values(tasks).find(t => t.name === name);
            function getLabelContent(label) {
                const color = getOfficialColor(label.index);
                const colorText = color ? ` background-color: ${color.background}; border-color: ${color.accent}; color: ${color.text}; ` : "";
                return `<div style="margin-left: 2px; margin-right: 2px; padding-left: 3px; padding-right: 3px; border-radius: 3px; border: 1pt solid black; min-width: 30px; height: 21px; ${colorText}">${label.text}</div>`
            }
            const text = task
            ? task.labels?.map(getLabelContent).join("")
            : isDebugging ? "Not found": "";

            const elt = document.createElement("div");
            elt.role = "gridcell";
            const content = document.createElement("div");
            content.className = "grid-cell-content CF_labels";
            content.innerHTML = text;
            elt.appendChild(content);
            row.insertBefore(elt, row.lastChild);
        });
    }

})();
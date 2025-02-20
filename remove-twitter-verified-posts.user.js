// ==UserScript==
// @name         Remove twitter verified posts
// @version      2025-02-20
// @description  It removes verified posts from twitter. Shit, did I call it twitter?
// @author       cfe
// @match        https://x.com/*
// @icon         https://www.google.com/s2/favicons?sz=64&domain=x.com
// @grant        none
// ==/UserScript==

(function() {
    'use strict';

    function removeVerified() {
        const posts = [...document.querySelectorAll(".r-1adg3ll")];
        const verified = posts.filter(post => post.querySelector("[data-testid='icon-verified']"));
        for(let post of verified) {
            post.style.display = "none";
        }
    }

    setInterval(removeVerified, 500);
})();

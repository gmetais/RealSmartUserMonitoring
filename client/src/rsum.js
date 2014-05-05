/* 
 * 
 * REAL SMART USER MONITORING
 * https://github.com/gmetais/RealSmartUserMonitoring
 * 
 * Copyright 2014 Gaël Métais
 * 
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 * 
 *     http://www.apache.org/licenses/LICENSE-2.0
 * 
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 * 
 */

(function(global, doc, undefined) {
    'use strict';

    // Grab the settings
    var settings = {};
    var defaultHost = '/rsum';
    var script = doc.querySelector('script[data-rsum-host],script[data-rsum-sample],script[data-rsum-conversion]');
    if (script !== null) {
        settings.host = script.getAttribute('data-rsum-host') || defaultHost;
        settings.sample = +script.getAttribute('data-rsum-sample') || 1;
        settings.conversion = (script.getAttribute('data-rsum-conversion') === 'true');
    } else if (global.RSUM_SETTINGS) {
        settings.host = global.RSUM_SETTINGS.host || defaultHost;
        settings.sample = +global.RSUM_SETTINGS.sample || 1;
        settings.conversion = global.RSUM_SETTINGS.conversion;
    }


    // Init state
    var state = JSON.parse(global.localStorage.getItem('rsum') || '{}');

    // Delete old sessions
    if (state.expireDate !== undefined && state.expireDate < Date.now()) {
        state = {};
    }

    // Create session
    if (state.expireDate === undefined) {
        state.sessionId = generateRandomId();
    }

    // Check if user is needed
    if (!isUserWanted()) {
        return saveState();
    }

    // Check if it is a conversion
    if (settings.conversion) {
        state.conversion = 1;
    }

    // Create page
    state.pages = state.pages || [];
    var page = {
        pageId : generateRandomId(),
        date : Date.now(),
        firstPage : (state.pages.length === 0)
    };

    // Check if page is in background
    if (isTabHidden()) {
        page.inBackgroundOnInit = 1;
    }

    state.pages.push(page);

    saveState();
    waitForDocumentReady();



    function generateRandomId() {
        return Date.now() + '' + Math.round(Math.random()*10000);
    }

    // Check if the user should be part of the sample rate
    function isUserWanted() {
        // Filter by sample rate
        if (settings.sample < 1) {
            if (state.inSample !== undefined) {
                return state.inSample;
            } else {
                // User never came, let's roll the dice
                var wanted = Math.random() < settings.sample;
                state.inSample = wanted;
                return wanted;
            }
        }
        return true;
    }

    // Attach an event on document ready
    function waitForDocumentReady() {
        function checkIfDocumentIsComplete() {
            if (doc.readyState === 'complete') {
                // Wait another 1ms to be just after the other scripts on the page
                setTimeout(readTimings, 2);
                return true;
            }
            return false;
        }
        if (!checkIfDocumentIsComplete()) {
            // No need to support browsers that don't support addEventListener
            doc.addEventListener('readystatechange', checkIfDocumentIsComplete);
        }
    }

    // Read Navigation API timings and store them
    function readTimings() {
        var timings = global.performance.timing;

        page.responseStart = timings.responseStart - timings.fetchStart;
        page.responseEnd = timings.responseEnd - timings.fetchStart;
        page.domInteractive = timings.domInteractive - timings.fetchStart;
        page.loadEventEnd = timings.loadEventEnd - timings.fetchStart;

        // If it is in background
        if (isTabHidden()) {
            page.inBackgroundOnLoad = 1;
            waitForTabVisibility();
        }

        saveState();
        sendData();
    }


    function sendData() {
        var xhr = new global.XMLHttpRequest();
        xhr.open('POST', settings.host + '/saveState', true);
        xhr.setRequestHeader('Content-type', 'text/plain');
        xhr.send(JSON.stringify(state));
    }

    // This function uses the HTML5 Visibility API
    // https://developer.mozilla.org/en-US/docs/Web/Guide/User_experience/Using_the_Page_Visibility_API
    function isTabHidden() {
        return !!(doc.hidden || doc.webkitHidden);
    }

    function waitForTabVisibility() {
        var eventNames = ['visibilitychange', 'webkitvisibilitychange'];
        function checkVisibility() {
            if (!isTabHidden()) {
                backInForeground();
                eventNames.forEach(function(name) {
                    doc.removeEventListener(name, checkVisibility);
                });
            }
        }
        eventNames.forEach(function(name) {
            doc.addEventListener(name, checkVisibility);
        });
    }

    function backInForeground() {
        page.timeInBackground = Date.now() - global.performance.timing.fetchStart;
        console.log("Setting timeInBackground");
        saveState();
        sendData();
        console.log(state);
    }

    function saveState() {
        global.localStorage.setItem('rsum', JSON.stringify(state));
    }

    
    // Public object declaration
    global.RSUM = {

        // Best way to send a conversion is in setOptions(), but you might need to dynamically send a conversion event
        conversion : function conversion() {
            if (state.conversion === undefined) {
                state.conversion = 1;
                saveState();
                sendData();
            } else {
                console.error('RSUM conversion already sent');
            }
        },

        // You might want to access the current page's state, you little hacker.
        // I use it for testing purpose.
        getState : function getState() {
            return state;
        }
    };

}(this, this.document));
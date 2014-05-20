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
    var defaultSessionTimeout = 120;
    var script = doc.querySelector('script[data-rsum-host],script[data-rsum-sample],script[data-rsum-conversion],script[data-rsum-session-timeout]');
    if (script !== null) {
        settings.host = script.getAttribute('data-rsum-host') || defaultHost;
        settings.sample = +script.getAttribute('data-rsum-sample') || 1;
        settings.conversion = (script.getAttribute('data-rsum-conversion') === 'true');
        settings.sessionTimeout = +script.getAttribute('data-rsum-session-timeout') || defaultSessionTimeout;
    } else if (global.RSUM_SETTINGS) {
        settings.host = global.RSUM_SETTINGS.host || defaultHost;
        settings.sample = +global.RSUM_SETTINGS.sample || 1;
        settings.conversion = global.RSUM_SETTINGS.conversion;
        settings.sessionTimeout = +global.RSUM_SETTINGS.sessionTimeout || defaultSessionTimeout;
    }

    // Metrics needed from the Navigation Timing API
    var navigationMetrics = ['responseStart', 'responseEnd', 'domInteractive', 'loadEventEnd'];

    // Init state
    var state = JSON.parse(global.localStorage.getItem('rsum') || '{}');

    // Delete old sessions
    if (state.expireDate !== undefined && state.expireDate < Date.now()) {
        state = {};
    }

    // Create session
    if (state.expireDate === undefined) {
        state.expireDate = Date.now() + (settings.sessionTimeout * 60 * 1000);
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
    var page = {
        pageId : generateRandomId()
    };

    // Check if page is in background
    if (isTabHidden()) {
        page.inBackgroundOnInit = 1;
    }

    // Check if it's the first page
    if (state.firstPage === undefined) {
        state.firstPage = page;
    } else {
        state.otherPages = state.otherPages || [];
        state.otherPages.push(page);
    }

    saveState();
    waitForDocumentReady();



    function generateRandomId() {
        return (Date.now()*1000 + Math.round(Math.random()*1000)).toString(36);
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

        navigationMetrics.forEach(function(metricName) {
            page[metricName] = timings[metricName] - timings.fetchStart;
        });

        // If it is in background
        if (isTabHidden()) {
            page.inBackgroundOnLoad = 1;
            waitForTabVisibility();
        }

        calculateAverages();
        saveState();
        sendData();
    }

    // Consolidate the load times of every pages
    function calculateAverages() {
        var averages = {};

        navigationMetrics.forEach(function(metricName) {
            var sum = 0, number = 0;

            if (state.firstPage[metricName] !== undefined) {
                sum += state.firstPage[metricName];
                number ++;
            }
            
            if (state.otherPages !== undefined) {
                state.otherPages.forEach(function(onePage) {
                    if (onePage[metricName] !== undefined) {
                        sum += onePage[metricName];
                        number ++;
                    }
                });
            }

            averages[metricName] = Math.round(sum / number);
            averages.number = number;
        });

        state.averages = averages;
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
        saveState();
        sendData();
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
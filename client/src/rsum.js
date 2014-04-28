(function(global, doc, undefined) {
    'use strict';
    
    // Default settings
    var settings = {
        serverHost : '/rsum',
        sample : 1,
        conversion : false
    };

    var uniquePageId = Date.now() + '' + Math.round(Math.random()*10000);
    var isConversion = false;
    var dataSent = false;
    var rawLocalStorage = global.localStorage.getItem('RSUM');
    var localData = (rawLocalStorage === null) ? {} : JSON.parse(rawLocalStorage);

    if (isUserWanted()) {
        waitForDocumentReady();
    }

    function init() {

        var data = {};

        // If it is a conversion
        if (settings.conversion || isConversion) {
            data.conversion = true;
        }

        // If it is a background tab
        data.inBackground = isTabHidden();
        if (data.inBackground) {
            waitForTabVisibility(sendForeground);
        }

        // Get navigation timings
        var timings = global.performance.timing;
        data.responseStart = timings.responseStart - timings.fetchStart;
        data.responseEnd = timings.responseEnd - timings.fetchStart;
        data.domInteractive = timings.domInteractive - timings.fetchStart;
        data.loadEventEnd = timings.loadEventEnd - timings.fetchStart;

        // Page id
        data.pageId = uniquePageId;

        sendData(data);

        // Save page visit in local storage
        global.localStorage.setItem('RSUM', JSON.stringify(localData));
    }

    // Check if the user should be part of the sample rate
    function isUserWanted() {
        // Filter by sample rate
        if (settings.sample < 1) {
            if (localData.inSample !== undefined) {
                return localData.inSample;
            } else {
                // User never came, let's roll the dice
                var wanted = Math.random() < settings.sample;
                localData.inSample = wanted;
                return wanted;
            }
        }
        return true;
    }

    function sendData(data) {
        postToServer('/init', data);
        dataSent = true;
    }

    function sendForeground() {
        var now = new Date().getTime();
        var data = {
            pageId: uniquePageId,
            timeInBackground: now - global.performance.timing.fetchStart
        };
        postToServer('/foreground', data);
    }

    function sendConversion() {
        var data = {
            pageId: uniquePageId
        };
        postToServer('/conversion', data);
    }

    function postToServer(route, data) {
        var xhr = new global.XMLHttpRequest();
        xhr.open('POST', settings.serverHost + route, true);
        xhr.withCredentials = true;
        xhr.setRequestHeader('Content-type', 'text/plain');
        xhr.send(JSON.stringify(data));
    }

    // This function uses the HTML5 Visibility API
    // https://developer.mozilla.org/en-US/docs/Web/Guide/User_experience/Using_the_Page_Visibility_API
    function isTabHidden() {
        return !!(doc.hidden || doc.msHidden || doc.webkitHidden || doc.mozHidden);
    }

    function waitForTabVisibility(callback) {
        var eventNames = ['visibilitychange', 'mozvisibilitychange', 'msvisibilitychange', 'webkitvisibilitychange'];
        function checkVisibility() {
            if (!isTabHidden()) {
                callback();
                eventNames.forEach(function(name) {
                    doc.removeEventListener(name, checkVisibility);
                });
            }
        }
        eventNames.forEach(function(name) {
            doc.addEventListener(name, checkVisibility);
        });
    }

    function waitForDocumentReady() {
        function checkIfDocumentIsComplete() {
            if (doc.readyState === 'complete') {
                setTimeout(init, 1000);
                return true;
            }
            return false;
        }
        if (!checkIfDocumentIsComplete()) {
            // No need to support browsers that don't support addEventListener
            doc.addEventListener('readystatechange', checkIfDocumentIsComplete);
        }
    }

    // Public object declaration
    global.RSUM = {
        
        // You can set options for the metrics to be sent the way you want
        // options.host (required) = The RSUM server root (ex: "http://mydomain.com:8383/rsum")
        // options.sample (optional) = The fraction of clients who should actually send data (0 > sample >= 1)
        // options.conversion (optional) = Should this page be counted as a conversion page ?
        setOptions : function setOptions(options) {
            if (dataSent) {
                console.error('RSUM Error: setOptions called too late, data already sent');
                return;
            }

            settings = {
                serverHost : options.host || settings.serverHost,
                sample : options.sample || settings.sample,
                conversion : options.conversion || settings.conversion
            };
        },

        // You might want to dynamically send a conversion event
        conversion : function conversion() {
            if (!isConversion) {
                isConversion = true;
                if (dataSent) {
                    sendConversion();
                    return;
                }
            } else {
                console.log('RSUM Warning: conversion already sent');
            }
        }
    };

}(window, window.document));
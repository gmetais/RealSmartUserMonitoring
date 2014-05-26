// TODO : use a settings file
var settings = require('./config/config.json');

var express = require('express');
var database = require('./lib/database')(settings);
var app = express();


// Middleware for a JSON body
function rawBody(req, res, next) {
    if (req.is('text/*')) {
        req.setEncoding('utf8');
        req.rawBody = '';
        req.on('data', function(chunk) {
            req.rawBody += chunk;
        });
        req.on('end', function(){
            try {
                req.json = JSON.parse(req.rawBody);
                next();
            } catch(e) {
                if (settings.debug) {
                    console.log('JSON parsing error: ' + req.rawBody);
                }
                res.send(500);
            }
        });
    } else {
        next();
    }
}

// Middleware for headers
function headersControl(req, res, next) {
    // Make it only work for the declared website (against pollution)
    if (req.headers.referer && req.headers.referer.indexOf(settings.websiteOrigin) === 0) {
        
        // Set the right CROSS-DOMAIN headers
        res.header('Access-Control-Allow-Origin', '*');
        res.header('Access-Control-Allow-Methods', 'POST, OPTIONS');
        res.header('Access-Control-Allow-Headers', 'Content-Type');

        // Remove the "x-powered-by: express" header
        res.removeHeader("x-powered-by");

    } else if (req.headers.referer && req.isPost) {
        console.log('Warning: request comming from unknown referer "' + req.headers.referer + '". The declared websiteOrigin in settings is "' + settings.websiteOrigin + '".');
    }
    next();
}

app.configure(function(){
    app.set('port', process.env.PORT || 8383);
    app.use(rawBody);
    app.use(headersControl);
    app.use(app.router);
});

// Receiver routes definition
var receiver = require('./lib/receiver')(app, settings, database);

// Dashboard routes definition
var dashboard = require('./lib/dashboard')(app, settings, database);

// Give access to Dashboard assets
app.use('/public', express.static(__dirname + '/public'));

// Used by grunt-express
module.exports = app;
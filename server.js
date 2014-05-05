// TODO : use a settings file
var settings = require('./config/config.json');

var express = require('express');
var database = require('./lib/database')(settings, express);
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
        //res.header('Access-Control-Allow-Origin', settings.websiteOrigin);
        res.header('Access-Control-Allow-Origin', '*');
        res.header('Access-Control-Allow-Methods', 'POST, OPTIONS');
        res.header('Access-Control-Allow-Headers', 'Content-Type');
        //res.header('Access-Control-Allow-Credentials', 'true');

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
    app.use(express.methodOverride());
    app.use(express.cookieParser());
    app.use(express.session({
        store: database.getSessionStore(),
        key: 'rsumId',
        secret: 'not-so-secret',
        cookie: {
            maxAge: settings.sessionTimeout * 60 * 1000
        }
    }));
    app.use(app.router);
});

// Dashboard routes
var dashboard = require('./lib/dashboard')(app, database);

// This call is made by every user
app.post('/rsum/init', function(req, res) {
    // Send response ASAP
    res.send(200);

    if (settings.debug) {
        console.log('User called init');
    }

    var data = {};

    // Read informations from browser
    data.pageId = req.json.pageId;
    data.responseStart = req.json.responseStart;
    data.responseEnd = req.json.responseEnd;
    data.domInteractive = req.json.domInteractive;
    data.loadEventEnd = req.json.loadEventEnd;
    data.inBackground = req.json.inBackground;
    data.conversion = (req.json.conversion === true);
    // Check if it is the user's first visit
    if (!req.session.userId) {
        data.firstPage = true;
        var userId = Date.now() + '' + Math.round(Math.random()*10000);
        database.insertNewVisit(userId, data);
        
        // Update session
        req.session.userId = userId;
        req.session.save();

        if (settings.debug) {
            console.log('First page');
        }
    } else {
        database.updateVisit(req.session.userId, data.loadEventEnd, data.conversion);

        if (settings.debug) {
            console.log('Another page');
        }
    }

    database.insertPageViewData(data);
});

// This call is made if the page was loaded in background and is back in foreground
app.post('/rsum/foreground', function(req, res) {
    // Send response ASAP
    res.send(200);

    if (settings.debug) {
        console.log('User called foreground');
    }

    // Save in DB
    database.updateForeground(req.json.pageId, req.json.timeInBackground);
});

// This call is made if there is an asynchronsous conversion event made by the user on the page
app.post('/rsum/conversion', function(req, res) {
    // Send response ASAP
    res.send(200);

    if (settings.debug) {
        console.log('User called conversion');
    }

    console.log(req.session);
    if (req.session.userId) {
        // Save in DB
        database.updateConversion(req.session.userId, req.json.pageId);
    }
});

// For grunt-express
module.exports = app;
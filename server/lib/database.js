module.exports = database;

function database(settings, express) {
    var mongoose = require('mongoose');
    var PageViewModel = require('./pageViewModel')(mongoose);
    var MongoStore = require('connect-mongo')(express);

    // Init database connexion
    var dbUri = 'mongodb://' + settings.mongoHost + ':' + settings.mongoPort + '/rsum';
    mongoose.connect(dbUri);
    mongoose.connection.on('open', function(db){
        console.log('Connected to ' + dbUri);
    });

    return {
        
        // Needed by express for sessions handling
        getSessionStore : function() {
            return new MongoStore({
                mongoose_connection : mongoose.connection,
                clear_interval: settings.sessionTimeout * 60
            });
        },

        // Insert into db
        insertPageViewData : function(data) {
            var pageView = new PageViewModel(data);
            pageView.save(function(err, pageView) {
                if (err) {
                    return console.error(err);
                }
                if (settings.debug) {
                    console.log('Data saved in DB');
                }
            });
        },

        // When the conversion is sent asynchronously by browser
        updateConversion : function(pageId) {
            console.log(pageId);
            PageViewModel.update({pageId: pageId}, {$set: {conversion: true}}, {multi: true}, function(err) {
                if (err) {
                    console.error(err);
                } else {
                    if (settings.debug) {
                        console.log('Conversion saved in DB');
                    }
                }
            });
        },

        // When the page was loaded in background and get back to foreground
        updateForeground : function(pageId, timeInBackground) {
            PageViewModel.update({pageId: pageId}, {$set: {timeInBackground: timeInBackground}}, {multi: false}, function(err) {
                if (err) {
                    console.error(err);
                } else {
                    if (settings.debug) {
                        console.log('Foreground time saved in DB');
                    }
                }
            });
        }
    };
}


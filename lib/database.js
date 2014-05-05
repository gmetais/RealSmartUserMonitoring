module.exports = database;

function database(settings, express) {
    var mongoose = require('mongoose');
    var MongoStore = require('connect-mongo')(express);

    // Data models
    var PageViewModel = require('./pageViewModel')(mongoose);
    var VisitModel = require('./visitModel')(mongoose);

    // Init database connexion
    var dbUri = 'mongodb://' + settings.mongoHost + ':' + settings.mongoPort + '/rsum';
    mongoose.connect(dbUri);
    mongoose.connection.on('open', function(db){
        console.log('Connected to ' + dbUri);
    });

    return {
        
        // Needed by express for sessions handling
        getSessionStore : function getSessionStore() {
            return new MongoStore({
                mongoose_connection : mongoose.connection,
                clear_interval: settings.sessionTimeout * 60
            });
        },

        // Insert into db
        insertPageViewData : function insertPageViewData(data) {
            var pageView = new PageViewModel(data);
            pageView.save(function(err, pageView) {
                if (err) {
                    return console.error(err);
                }
                if (settings.debug) {
                    console.log('PageView saved in DB');
                }
            });
        },

        // When it is the first page, create a new Visit
        insertNewVisit : function insertNewVisit(userId, data) {
            var visit = new VisitModel({
                userId: userId,
                pageViews: 1,
                arrivalDate: new Date(),
                averageLoadTime: data.loadEventEnd,
                conversion: data.conversion
            });

            visit.save(function(err, visit) {
                if (err) {
                    return console.error(err);
                }
                if (settings.debug) {
                    console.log('New visit saved in DB');
                }
            });
        },

        // When it's not the first page, update the existing Visit
        updateVisit : function updateVisit(userId, loadTime, conversion) {
            VisitModel.findOne({userId: userId}, function(err, visit) {
                
                console.log('Update request for userId ' + userId);

                if (err) {
                    // This should not happen
                    return;
                }

                // Update attributes
                if (loadTime !== null) {
                    visit.averageLoadTime = ((visit.averageLoadTime * visit.pageViews) + loadTime) / (visit.pageViews + 1);
                    visit.pageViews ++;
                }
                if (conversion) {
                    visit.conversion = true;
                }

                // Save
                visit.save(function(err) {
                    if (err) {
                        console.log(err);
                    }
                });
            });
        },

        // When the conversion is sent asynchronously by browser
        updateConversion : function updateConversion(userId, pageId) {
            // Update the page
            PageViewModel.update({pageId: pageId}, {$set: {conversion: true}}, {multi: true}, function(err) {
                if (err) {
                    console.error(err);
                } else {
                    if (settings.debug) {
                        console.log('Conversion saved in DB');
                    }
                }
            });

            // Update the visit
            console.log('Update visit');
            this.updateVisit(userId, null, true);
        },

        // When the page was loaded in background and get back to foreground
        updateForeground : function updateForeground(pageId, timeInBackground) {
            PageViewModel.update({pageId: pageId}, {$set: {timeInBackground: timeInBackground}}, {multi: false}, function(err) {
                if (err) {
                    console.error(err);
                } else {
                    if (settings.debug) {
                        console.log('Foreground time saved in DB');
                    }
                }
            });
        },

        getNumberOfVisits : function getNumberOfVisits(callback) {
            VisitModel.count({}, function(err, count) {
                callback(count);
            });
        }
    };
}


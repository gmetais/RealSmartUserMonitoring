module.exports = dashboard;

function dashboard(app, settings, database) {
    var exphbs  = require('express3-handlebars');
    app.engine('handlebars', exphbs({defaultLayout: 'main'}));
    app.set('view engine', 'handlebars');

    app.get('/', function(req, res) {
        var startDate = 0, endDate = 999999999999999;
        
        /*database.getNumberOfVisits(startDate, endDate, function(value) {
            res.render('home', {
                nbVisits: value
            });
        });*/

        database.getGeneralMetrics(startDate, endDate, function(results) {
            res.render('home', results);
        });

        /*database.getAverageFirstPageLoadTime(startDate, endDate, function(value) {
            res.render('home', {
                avgPageLoadTime: value
            });
        });*/
    });
}
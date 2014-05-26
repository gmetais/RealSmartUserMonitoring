module.exports = dashboard;

function dashboard(app, settings, database) {
    var exphbs  = require('express3-handlebars');
    app.engine('handlebars', exphbs({defaultLayout: 'main'}));
    app.set('view engine', 'handlebars');

    app.get('/', function(req, res) {
        var startDate = 0, endDate = 999999999999999;
        

        database.getGeneralMetrics(startDate, endDate, function(generalMetrics) {
            var results = {
                generalMetrics: generalMetrics
            };
            database.getMetricsRepartition(startDate, endDate, generalMetrics, function(repartition) {
                results.repartition = repartition;
                results.stringified = JSON.stringify(results);
                res.render('home', results);
            });
        });

    });
}
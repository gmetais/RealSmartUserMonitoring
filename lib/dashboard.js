module.exports = dashboard;

function dashboard(app, database) {
    var exphbs  = require('express3-handlebars');
    app.engine('handlebars', exphbs({defaultLayout: 'main'}));
    app.set('view engine', 'handlebars');

    app.get('/', function(req, res) {
        database.getNumberOfVisits(function(count) {
            res.render('home', {
                nbVisits: count
            });
        });
    });

}
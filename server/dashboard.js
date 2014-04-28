module.exports = dashboard;

function dashboard(app) {

    app.get('/', function(req, res) {
        res.send(200, 'Dashboard will be here');
        
    });

}
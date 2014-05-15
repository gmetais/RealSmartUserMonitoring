module.exports = receiver;

function receiver(app, settings, database) {

    // This call is made by every user
    app.post('/rsum/saveState', function(req, res) {
        
        // Send response ASAP
        res.send(200);

        if (settings.debug) {
            console.log('User called init');
        }

        var state = req.json;

        state.lastActionDate = Date.now();

        database.saveState(state);
    });
}
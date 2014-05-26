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
        state.ux = receiverFunctions.scoreFormula(state);


        database.saveState(state);
    });

    var receiverFunctions = {

        scoreFormula : function(state) {
            // Calculation of the User Experience score (100 is best, 0 is worse)
            // 
            // Rule 1 : The average loadEventEnd counts for 80 points. This score is linear between 1s (70pts) and 15s (0pts)
            // Rule 2 : The max loadEventEnd counts for 20 points. This score is linear between 5s (20pts) and 20s (0pts)
            // Rule 3 : The max responseStart counts for 10 points. This score is linear between 1s (10pts) and 5s (0pts)
            // 
            // There is no magic formula, so any help is welcome to improve it!

            function linear(x, maxScore, minMilliseconds, maxMilliseconds) {
                var a = (maxScore / (minMilliseconds - maxMilliseconds));
                var b = (maxScore * maxMilliseconds / (maxMilliseconds - minMilliseconds));
                var y = a * x + b;

                y = Math.max(y, 0);
                y = Math.min(y, maxScore);

                return y;
            }

            var rule1 = linear(state.averages.loadEventEnd, 70, 1000, 15000);
            var rule2 = linear(state.maximums.loadEventEnd, 20, 5000, 20000);
            var rule3 = linear(state.maximums.responseStart, 10, 1000, 5000);

            return Math.round(rule1 + rule2 + rule3);
        }

    };

    return receiverFunctions;

}
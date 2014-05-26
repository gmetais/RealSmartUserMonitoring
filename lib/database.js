module.exports = database;

function database(settings) {
    var elasticsearch = require('elasticsearch');
    var client = new elasticsearch.Client({
        host: settings.elasticsearchHost,
        log: {
            level: 'trace'
        }
    });

    var databaseReady = false;

    client.ping({
        requestTimeout: 1000,
        hello: 'elasticsearch!'
    }, function (error) {
        if (error) {
            console.error('Elasticsearch cluster not responding!');
        } else {
            console.log('Elasticsearch cluster is responding');

            checkIfIndexExists();
        }
    });

    function checkIfIndexExists() {
        client.indices.exists({index: 'rsum'}, function(err, exists) {
            if (exists) {
                onDatabaseReady();
            } else {
                createIndex();
            }
        });
    }

    function createIndex() {

        var pageMapping = {
            'properties': {
                'date': {'type': 'long'},
                'domInteractive': {'type': 'long'},
                'loadEventEnd': {'type': 'long'},
                'pageId': {'type': 'string'},
                'responseEnd': {'type': 'long'},
                'responseStart': {'type': 'long'}
            }
        };

        client.indices.create({
            index: 'rsum',
            body: {
                mappings: {
                    'state': {
                        'properties': {
                            'sessionId': {'type': 'string'},
                            'expireDate': {'type': 'long'},
                            'lastActionDate': {'type': 'long'},
                            'firstPage': pageMapping,
                            'otherPages': pageMapping,
                            'averages': {
                                'properties': {
                                    'domInteractive': {'type': 'long'},
                                    'loadEventEnd': {'type': 'long'},
                                    'number': {'type': 'long'},
                                    'responseEnd': {'type': 'long'},
                                    'responseStart': {'type': 'long'}
                                }
                            }
                        }
                    }
                }
            }
        }, function (err, resp) {
            if (err) {
                console.error(err);
            } else {
                onDatabaseReady();
            }
        });
    }

    function onDatabaseReady() {
        databaseReady = true;
        // TODO : tell the server
    }

    var databaseFunctions = {
        
        saveState : function(state) {
            client.update({
                index: 'rsum',
                type: 'state',
                id: state.sessionId,
                body: {
                    doc: state,
                    'doc_as_upsert' : true
                }
            }, function (err, resp) {
                if (err) {
                    console.error(err.message);
                } else {
                    console.dir(resp);
                }
            });
        },

        getNumberOfVisits : function(startDate, endDate, callback) {
            client.count({
                index: 'rsum',
                type: 'state',
                body: {
                    query: {
                        filtered: {
                            filter: {
                                'numeric_range': {
                                    lastActionDate: {
                                        gte: startDate,
                                        lte: endDate
                                    }
                                }
                            }
                        }
                    }
                }
            }, function(err, resp) {
                if (err) {
                    console.error(err.message);
                    callback(0);
                } else {
                    callback(resp.count);
                }
            });
        },

        getGeneralMetrics : function(startDate, endDate, callback) {
            client.search({
                index: 'rsum',
                type: 'state',
                body: {
                    query: {
                        filtered: {
                            filter: {
                                'numeric_range': {
                                    lastActionDate: {
                                        gte: startDate,
                                        lte: endDate
                                    }
                                }
                            }
                        }
                    },
                    size: 0,
                    "aggs": {
                        "nbPages": {
                            "sum": {
                                "field": "averages.number"
                            }
                        },
                        "avgUserExperience": {
                            "avg": {
                                "field": "ux"
                            }
                        },
                        "avgFirstPageLoadTime": {
                            "avg": {
                                "field": "firstPage.loadEventEnd"
                            }
                        },
                        "firstPagePercentiles": {
                            "percentiles": {
                                "field": "firstPage.loadEventEnd",
                                "percents": [2, 98]
                            }
                        },
                        "avgPageLoadTime": {
                            "avg": {
                                "field": "averages.loadEventEnd"
                            }
                        },
                        "allPagesPercentiles": {
                            "percentiles": {
                                "field": "averages.loadEventEnd",
                                "percents": [2, 98]
                            }
                        },
                        "bounce": {
                            "missing": {
                                "field": "otherPages.pageId"
                            }
                        },
                    }
                }
            }, function(err, resp) {
                if (err) {
                    console.error(err.message);
                    callback({});
                } else {
                    var results = {
                        nbVisits: resp.hits.total,
                        nbPages: resp.aggregations.nbPages.value,
                        pagesPerVisit: resp.aggregations.nbPages.value / resp.hits.total,
                        bounceRate: resp.aggregations.bounce.doc_count / resp.hits.total * 100,
                        avgUserExperience: Math.round(resp.aggregations.avgUserExperience.value * 10) / 10,
                        avgPageLoadTime: resp.aggregations.avgPageLoadTime.value,
                        avgFirstPageLoadTime: resp.aggregations.avgFirstPageLoadTime.value,
                        minLoadTime : Math.min(resp.aggregations.firstPagePercentiles['2.0'], resp.aggregations.allPagesPercentiles['2.0']),
                        maxLoadTime : Math.max(resp.aggregations.firstPagePercentiles['98.0'], resp.aggregations.allPagesPercentiles['98.0'])
                    };
                    callback(results);
                }
            });
        },

        getMetricsRepartition : function(startDate, endDate, generalMetrics, callback) {
            var idealRange = databaseFunctions.getIdealRange(generalMetrics.minLoadTime, generalMetrics.maxLoadTime);
            generalMetrics.minLoadTime = idealRange.min;
            generalMetrics.maxLoadTime = idealRange.max;
            generalMetrics.intervalLoadTime = idealRange.interval;

            client.search({
                index: 'rsum',
                type: 'state',
                body: {
                    query: {
                        filtered: {
                            filter: {
                                'numeric_range': {
                                    lastActionDate: {
                                        gte: startDate,
                                        lte: endDate
                                    }
                                }
                            }
                        }
                    },
                    size: 0,
                    "aggs": {
                        "firstPageRepartition": {
                            "histogram": {
                                "field": "firstPage.loadEventEnd",
                                "interval": idealRange.interval
                            }
                        },
                        "allPagesRepartition": {
                            "histogram": {
                                "field": "averages.loadEventEnd",
                                "interval": idealRange.interval
                            }
                        }
                    }
                }
            }, function(err, resp) {
                if (err) {
                    console.error(err.message);
                    callback({});
                } else {
                    var firstPageSerie = databaseFunctions.transformToSerie(resp.aggregations.firstPageRepartition.buckets);
                    var allPagesSerie = databaseFunctions.transformToSerie(resp.aggregations.allPagesRepartition.buckets);

                    var results = {
                        firstPageLoadTime: databaseFunctions.filterLessAndMore(firstPageSerie, generalMetrics.minLoadTime, generalMetrics.maxLoadTime),
                        allPagesLoadTime: databaseFunctions.filterLessAndMore(allPagesSerie, generalMetrics.minLoadTime, generalMetrics.maxLoadTime)
                    };
                    callback(results);
                }
            });
        },

        getIdealRange : function(min, max) {
            var possibleIntervals = [1, 2, 5, 10, 20, 50, 100, 200, 500, 1000, 2000, 5000, 10000, 20000, 50000, 100000, 200000, 500000];
            var range = max - min;
            
            // Find the ideal interval for a good readability
            var interval = 1;
            for (var i=0, iMax=possibleIntervals.length ; i<iMax ; i++) {
                if ((range / 20) > possibleIntervals[i]) {
                    interval = possibleIntervals[i];
                }
            }

            return {
                min: Math.floor(min / interval) * interval,
                max: Math.ceil(max / interval) * interval,
                interval: interval
            };
        },

        transformToSerie: function(buckets) {
            var serie = [];
            buckets.forEach(function(value) {
                serie.push([value.key, value.doc_count]);
            });
            return serie;
        },

        // Takes all values under 'min' in the serie and creates a 'less' value with them
        // The values above 'max' are pushed in a 'more' value
        filterLessAndMore : function(serie, min, max) {
            return serie.filter(function(element) {
                return (element[0] >= min && element[0] <= max);
            });
        }
    };

    return databaseFunctions;
}


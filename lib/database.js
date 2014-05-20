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

    function getIdealRange(min, max) {
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
            min: Math.round(min / interval) * interval,
            max: Math.round(max / interval) * interval,
            interval: interval
        };
    }

    function transformToSeries(buckets) {
        var series = [];
        buckets.forEach(function(value) {
            series.push([value.key, value.doc_count]);
        });
        return series;
    }

    return {
        
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
                        avgPageLoadTime: resp.aggregations.avgPageLoadTime.value,
                        avgFirstPageLoadTime: resp.aggregations.avgFirstPageLoadTime.value,
                        firstPage: {
                            perc2: resp.aggregations.firstPagePercentiles['2.0'],
                            perc98: resp.aggregations.firstPagePercentiles['98.0']
                        },
                        allPages: {
                            perc2: resp.aggregations.allPagesPercentiles['2.0'],
                            perc98: resp.aggregations.allPagesPercentiles['98.0']
                        }
                    };
                    callback(results);
                }
            });
        },

        getMetricsRepartition : function(startDate, endDate, generalMetrics, callback) {
            var idealRange = getIdealRange(
                Math.min(generalMetrics.firstPage.perc2, generalMetrics.allPages.perc2), 
                Math.max(generalMetrics.firstPage.perc98, generalMetrics.allPages.perc98)
            );

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
                                "interval": idealRange.interval,
                                "min_doc_count": 0,
                                "extended_bounds": {
                                    "min": idealRange.min,
                                    "max": idealRange.max
                                }
                            }
                        },
                        "allPagesRepartition": {
                            "histogram": {
                                "field": "averages.loadEventEnd",
                                "interval": idealRange.interval,
                                "min_doc_count": 0,
                                "extended_bounds": {
                                    "min": idealRange.min,
                                    "max": idealRange.max
                                }
                            }
                        }
                    }
                }
            }, function(err, resp) {
                if (err) {
                    console.error(err.message);
                    callback({});
                } else {
                    var results = {
                        firstPageLoadTime: transformToSeries(resp.aggregations.firstPageRepartition.buckets),
                        allPagesLoadTime: transformToSeries(resp.aggregations.allPagesRepartition.buckets)
                    }
                    callback(results);
                }
            });
        }
    };
}


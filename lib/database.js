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
                            'otherPages': pageMapping
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
                        "firstPageCount": {
                            "value_count": {
                                "field": "firstPage.loadEventEnd"
                            }
                        },
                        "firstPageSum": {
                            "sum": {
                                "field": "firstPage.loadEventEnd"
                            }
                        },
                        "otherPagesCount": {
                            "value_count": {
                                "field": "otherPages.loadEventEnd"
                            }
                        },
                        "otherPagesSum": {
                            "sum": {
                                "field": "otherPages.loadEventEnd"
                            }
                        },
                        "bounce": {
                            "missing": {
                                "field": "otherPages.pageId"
                            }
                        }
                    }
                }
            }, function(err, resp) {
                if (err) {
                    console.error(err.message);
                    callback(0);
                } else {
                    var results = {
                        nbVisits: resp.hits.total,
                        nbPages: resp.aggregations.firstPageCount.value + resp.aggregations.otherPagesCount.value,
                        pagesPerVisit: (resp.aggregations.firstPageCount.value + resp.aggregations.otherPagesCount.value) / resp.hits.total,
                        bounceRate: resp.aggregations.bounce.doc_count / resp.hits.total * 100,
                        avgPageLoadTime: (resp.aggregations.firstPageSum.value + resp.aggregations.otherPagesSum.value) / (resp.aggregations.firstPageCount.value + resp.aggregations.otherPagesCount.value),
                        avgFirstPageLoadTime: resp.aggregations.firstPageSum.value / resp.aggregations.firstPageCount.value
                    };
                    callback(results);
                }
            });
        },

        getLoadTimeRepartition : function(startDate, endDate, callback) {

        }
    };
}


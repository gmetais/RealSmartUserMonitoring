$(function () {
    var commonOptions = {
        chart: {
            style: {
                fontFamily: '"Century Gothic", helvetica, arial, sans-serif'
            }
        },
        credits: {
            enabled: false
        }
    };


    $('#uxGauge').highcharts(Highcharts.merge(commonOptions, {

        chart: {
            type: 'solidgauge'
        },
        
        title: {
            text: 'UX Score',
            y: 40
        },

        subtitle: {
            text: 'Average for all users',
            y: 60
        },
        
        pane: {
            center: ['50%', '85%'],
            size: '140%',
            startAngle: -90,
            endAngle: 90,
            background: {
                backgroundColor: (Highcharts.theme && Highcharts.theme.background2) || '#EEE',
                innerRadius: '60%',
                outerRadius: '100%',
                shape: 'arc'
            }
        },

        tooltip: {
            enabled: false
        },
           
        // the value axis
        yAxis: {
            min: 0,
            max: 100,
            stops: [
                [0.1, '#cd2929'], // red
                [0.6, '#f1c40f'], // yellow
                [0.9, '#47bbb3'] // green
            ],
            lineWidth: 0,
            minorTickInterval: null,
            tickPixelInterval: 800,
            tickWidth: 0,
            title: {
                y: -70
            },
            labels: {
                y: 16
            }        
        },
        
        plotOptions: {
            solidgauge: {
                dataLabels: {
                    y: -30,
                    borderWidth: 0,
                    useHTML: true
                }
            }
        },

        series: [{
            data: [window.rsumResults.generalMetrics.avgUserExperience],
            dataLabels: {
                format: '<div style="text-align:center"><span style="font-size:25px;color:' + 
                    ((Highcharts.theme && Highcharts.theme.contrastTextColor) || 'black') + '">{y}</span>' + 
                    '<span style="font-size:12px;color:silver">/100</span></div>'
            },
            tooltip: {
                valueSuffix: '/100'
            }
        }]
    }));

    $('#firstPageLoadTimeChart').highcharts(Highcharts.merge(commonOptions, {
        chart: {
            type: 'column'
        },
        title: {
            text: 'First Page Load Time'
        },
        subtitle: {
            text: 'Average: ' + Math.round(window.rsumResults.generalMetrics.avgFirstPageLoadTime) + ' ms'
        },
        xAxis: {
            min: window.rsumResults.generalMetrics.minLoadTime,
            max: window.rsumResults.generalMetrics.maxLoadTime,
            tickInterval: window.rsumResults.generalMetrics.intervalLoadTime * 2
        },
        yAxis: {
            min: 0,
            title: {
                text: 'Number of users'
            }
        },
        tooltip: {
            headerFormat: '<span style="style="color:{series.color};padding:0">Time: {point.key} ms</span><table>',
            pointFormat: '<tr><td style="color:{series.color};padding:0">Number of users: </td><td style="padding:0"><b>{point.y}</b></td></tr>',
            footerFormat: '</table>',
            shared: true,
            useHTML: true
        },
        plotOptions: {
            column: {
                pointPadding: 0,
                borderWidth: 0
            }
        },
        series: [{
            name: 'Time in milliseconds',
            data: window.rsumResults.repartition.firstPageLoadTime
        }],
        colors: ['#47bbb3']
    }));

    $('#loadTimeChart').highcharts(Highcharts.merge(commonOptions, {
        chart: {
            type: 'column'
        },
        title: {
            text: 'All pages Load Time'
        },
        subtitle: {
            text: 'Average: ' + Math.round(window.rsumResults.generalMetrics.avgPageLoadTime) + ' ms'
        },
        xAxis: {
            min: window.rsumResults.generalMetrics.minLoadTime,
            max: window.rsumResults.generalMetrics.maxLoadTime,
            tickInterval: window.rsumResults.generalMetrics.intervalLoadTime * 2
        },
        yAxis: {
            min: 0,
            title: {
                text: 'Number of users'
            }
        },
        tooltip: {
            headerFormat: '<span style="style="color:{series.color};padding:0">Time: {point.key} ms</span><table>',
            pointFormat: '<tr><td style="color:{series.color};padding:0">Number of users: </td><td style="padding:0"><b>{point.y}</b></td></tr>',
            footerFormat: '</table>',
            shared: true,
            useHTML: true
        },
        plotOptions: {
            column: {
                pointPadding: 0,
                borderWidth: 0
            }
        },
        series: [{
            name: 'Time in milliseconds',
            data: window.rsumResults.repartition.allPagesLoadTime
        }],
        colors: ['#47bbb3']
    }));
});
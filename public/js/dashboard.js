$(function () {
    $('#firstPageLoadTimeChart').highcharts({
        chart: {
            type: 'column'
        },
        title: {
            text: 'First Page Load Time'
        },
        subtitle: {
            text: 'Repartition of load time '
        },
        /*xAxis: {
            categories: [
                'Jan',
                'Feb',
                'Mar',
                'Apr',
                'May',
                'Jun',
                'Jul',
                'Aug',
                'Sep',
                'Oct',
                'Nov',
                'Dec'
            ]
        },*/
        yAxis: {
            min: 0,
            title: {
                text: 'Number of users'
            }
        },
        /*tooltip: {
            headerFormat: '<span style="font-size:10px">{point.key}</span><table>',
            pointFormat: '<tr><td style="color:{series.color};padding:0">{series.name}: </td>' +
                '<td style="padding:0"><b>{point.y:.1f} mm</b></td></tr>',
            footerFormat: '</table>',
            shared: true,
            useHTML: true
        },*/
        plotOptions: {
            column: {
                pointPadding: 0.2,
                borderWidth: 0
            }
        },
        series: [{
            name: 'Time in milliseconds',
            data: window.graphValues.firstPageLoadTime
        }]
    });

    $('#loadTimeChart').highcharts({
        chart: {
            type: 'column'
        },
        title: {
            text: 'Average Load Time'
        },
        subtitle: {
            text: 'Repartition of load time'
        },
        /*xAxis: {
            categories: [
                'Jan',
                'Feb',
                'Mar',
                'Apr',
                'May',
                'Jun',
                'Jul',
                'Aug',
                'Sep',
                'Oct',
                'Nov',
                'Dec'
            ]
        },*/
        yAxis: {
            min: 0,
            title: {
                text: 'Number of users'
            }
        },
        /*tooltip: {
            headerFormat: '<span style="font-size:10px">{point.key}</span><table>',
            pointFormat: '<tr><td style="color:{series.color};padding:0">{series.name}: </td>' +
                '<td style="padding:0"><b>{point.y:.1f} mm</b></td></tr>',
            footerFormat: '</table>',
            shared: true,
            useHTML: true
        },*/
        plotOptions: {
            column: {
                pointPadding: 0.2,
                borderWidth: 0
            }
        },
        series: [{
            name: 'Time in milliseconds',
            data: window.graphValues.allPagesLoadTime
        }]
    });
});
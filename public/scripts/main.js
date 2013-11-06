app = {    
    
    // ---------------------------------------------------------------------------------------------------------
    // Resize Functions
    // - Resize various divs/elements to fit dynamically 
    // ---------------------------------------------------------------------------------------------------------
    /*
resizeContent: function() {
        var windowHeight = $(window).outerHeight();
        var headerHeight = $('#header').outerHeight(true);
        
        var contentHeight = windowHeight - headerHeight;
        
        console.log(windowHeight);
        console.log(headerHeight);
        console.log(contentHeight);
        
        $('#mainPage .content').outerHeight(contentHeight);
    }
*/

}
// Charts 
// -----------------------------------------------------
function makeCharts() {
    var todaysChart = {
        title: {
            text: 'Consumption vs Lines of Code',
            x: -50 //center
        },
        xAxis: {
            type: 'datetime',
            tickPixelInterval: 48,
            tickinterval: 24 * 3600 * 1000,
            maxZoom: 24 * 3600 * 1000,
            dateTimeLabelFormats: {
                hour: '%l%P'
            },
/*
            formatter: function()
            {
                return Highcharts.dateFormat('%l:%M%P', this.y);
            },
*/
            title: 
            {
                text: 'Time of Day'
            },
        },
        yAxis: [{
            title: {
                text: '# of cups'
            },
            plotLines: [{
                value: 0,
                width: 1,
                color: '#808080'
            }]
        }, {
            title: {
                text: '# of lines'
            },
            opposite: true,
            plotLines: [{
                value: 0,
                width: 1,
                color: '#808080'
            }]
        }],
/*
        tooltip: {
            valueSuffix: ''
        },
*/
        legend: {
            layout: 'vertical',
            align: 'right',
            verticalAlign: 'middle',
            borderWidth: 0
        },
        series: [
            todaysChartCaffeineSeries,
            todaysChartAdderallSeries,
            todaysChartBeerSeries,/*
{
            name: 'Coffee',
            yAxis: 0,
            data: [
                [Date.UTC(2013,11,03,5,57,0,0), 1],
                [Date.UTC(2013,11,03,10,57,0,0), 2],
                [Date.UTC(2013,11,03,13,57,0,0), 3],
                [Date.UTC(2013,11,03,15,57,0,0), 4]]
        },
*/
        {
            name: 'Code',
            yAxis: 1,
            data: [
                /*
[Date.UTC(2013,10,03,5,57,0,0), 50],
                [Date.UTC(2013,10,03,10,57,0,0), 25],
                [Date.UTC(2013,10,03,13,57,0,0), 45],
                [Date.UTC(2013,10,03,15,57,0,0), 85]
*/]
        }]
/*         series: todaysChartSeries */
    };
    $("#todaysChart").highcharts(todaysChart);
    /*
$("a.chart-switcher").click(function() {
        var chartToLoad = $(this).data('chart');
        
        $("dd").each(function() {
            if ($(this).children(':first').data('chart') == chartToLoad) {
                $(this).addClass('active');
            } else {
                $(this).removeClass('active');
            }
        });
    
        switch (chartToLoad) {
            case 'repairs30day':
                var chartData = repairs30dayChart;
                break;
            case 'repairsAllTime':
                var chartData = repairsAllTimeChart;
                break;
            case 'deviceTypes':
                var chartData = deviceTypesChart;
                break;
            case 'serviceTypes':
                var chartData = serviceTypesChart;
                break;
        }

        $("#chart-container").highcharts(chartData);
    });
*/
}

// ---------------------------------------------------------------------------------------------------------
// Run after DOM is ready
// ---------------------------------------------------------------------------------------------------------
$(function() {
    // =================================================================================================
    // Error Modal
    // + Open/Close universal error modal for generic error descriptions
    // =================================================================================================
    errorModal = {
        modal       : $('#errorModal'),
        heading     : $('.errorHeading', this.modal),
        description : $('.errorDescription', this.modal),
        
        open: function(errorHeading, errorDescription) {
            this.modal.foundation('reveal', 'open');
            this.heading.text(errorHeading);
            this.description.text(errorDescription);
        },
        close: function() {
            this.modal.foundation('reveal', 'close');
        },
    };

    // *********************************
    console.log('--- DOM is ready ---');
    // *********************************
    $(document).foundation();
    var socket = io.connect('http://localhost:5500/');
    less.watch();
    
    socket.on('event_types', function (data) {
        var event_types = data;
        
        $('#logButtons').html('');
        
        for (var i = 0; i < event_types.length; i++) {
            var event_type = $('<button id="' + event_types[i].event_name.toLowerCase() + '" data-event_type_id="' + event_types[i].event_type_id + '">' + event_types[i].event_name + '</button>');
        
            $('#logButtons').append(event_type);
            
            event_type.on('click', function() {
                var self = $(this);
                
                var event_type_id = self.data('event_type_id');
                socket.emit('log_event', { 'event_type_id': event_type_id } );
            });
        }
    });
    
    socket.on('all_events', function (data) {
        var events_html = data;
        
        $('#allEvents').html(events_html);
    });
    socket.on('todays_events', function (data) {
        var events_html = data.events_html;
        
        $('#todaysEvents').html(events_html);
    });
    
    $('#todaysEvents').on('click', '.deleteEvent', function() {
        var self = $(this);
        var eventLine = self.parents('.event');
        var event_id = eventLine.data('event_id');

        socket.emit('delete_event', { 'event_id': event_id } );
    });
    
    socket.on('todays_events_data', function (data) {
        var events_data = data.events_data;
        console.log(events_data);
        
        var caffeineData = [];
        var adderallData = [];
        var beerData = [];
                
        var caffeineCount = 0;
        var adderallCount = 0;
        var beerCount = 0;
        for(var i=0; i < events_data.length; i++) {
            if(events_data[i].event_name == 'Coffee' || events_data[i].event_name == 'Espresso' || events_data[i].event_name == 'Tea' || events_data[i].event_name == 'Energy Drink' ) {
                var date_created = new Date(events_data[i].date_created);
                caffeineCount++;
                dataPoint = [Date.UTC(date_created.getFullYear(),date_created.getMonth(),date_created.getDate(),date_created.getHours(),date_created.getMinutes(),date_created.getSeconds(),0), caffeineCount];
                caffeineData.push(dataPoint);
            }
            if(events_data[i].event_name == 'Adderall') {
                var date_created = new Date(events_data[i].date_created);
                adderallCount++;
                dataPoint = [Date.UTC(date_created.getFullYear(),date_created.getMonth(),date_created.getDate(),date_created.getHours(),date_created.getMinutes(),date_created.getSeconds(),0), adderallCount];
                adderallData.push(dataPoint);
            }
            if(events_data[i].event_name == 'Beer') {
                var date_created = new Date(events_data[i].date_created);
                beerCount++;
                dataPoint = [Date.UTC(date_created.getFullYear(),date_created.getMonth(),date_created.getDate(),date_created.getHours(),date_created.getMinutes(),date_created.getSeconds(),0), beerCount];
                beerData.push(dataPoint);
            }
        }
        
        window.todaysChartCaffeineSeries = {
            name: 'Caffeine',
            yAxis: 0,
            data: caffeineData
        };
        window.todaysChartAdderallSeries = {
            name: 'Adderall',
            yAxis: 0,
            data: adderallData
        };
        window.todaysChartBeerSeries = {
            name: 'Beer',
            yAxis: 0,
            data: beerData
        };
        
        makeCharts();
    });
    
    
    
    
});

// ---------------------------------------------------------------------------------------------------------
// Run after page has loaded all elements (images, etc)
// ---------------------------------------------------------------------------------------------------------
$(window).load(function(){
    // **********************************
    console.log('--- DOM is loaded ---');
    // **********************************
});
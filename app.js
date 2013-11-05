var express = require("express");
var config = require('./config.js');
var app = express();
var port = 5500;

console.log("Listening on port " + port);

app.set('views', __dirname + '/views');
app.set('view engine', "jade");
app.engine('jade', require('jade').__express);
app.get("/", function(req, res){
    res.render("index");
});
app.use(express.static(__dirname + '/public'));

var io = require('socket.io').listen(app.listen(port));


var mysql      = require('mysql');
var connection = mysql.createConnection({
    host     : config.db_host,
    user     : config.db_user,
    password : config.db_password,
    database : config.db_database,
});


// Connect to MySQL
connection.connect(function(err) {
    if (err) { throw err; }
});

var sys = require('sys')
var exec = require('child_process').exec;
function execute(command, callback){
    exec(command, function(error, stdout, stderr){ callback(stdout); });
};


// Find all the branches in icracked, insert new ones if found
function setBranches() {
    execute('(cd /Library/WebServer/Documents/web/icracked/website/; git branch)', function(output) {
        var branches = [];
        var lines = output.split(/\n/);
        for (var i=0; i < lines.length; i++) {
            // only push this line if it contains a non whitespace character.
            if (/\S/.test(lines[i])) {
                branches.push(lines[i].replace(/\s+/g, '').replace('*', ''));
            }
        }
        
        
        for(var j=0; j<branches.length; j++) {
            var query = 'INSERT INTO caffeinecoder.branches (repository_id, branch_name) VALUES (1, \'' + branches[j] + '\')';
            
            connection.query(query, function(err, rows, fields) {
                if (err) { console.log(err); }
                else {
                    console.log('success');
                }
            });
        }
        setLines(branches);
    });
};

function setLines(branches) {
    for(var i=0; i<branches.length; i++) {
         setLinesForBranch(branches[i]);
         setTotalLinesForBranch(branches[i]);
    }
}

function setLinesForBranch(branch_name, callback) {
    var currentDatetime = new Date(); 
    var lastMin = (currentDatetime.getMonth()+1) + '/'
                + currentDatetime.getDate() + '/'
                + currentDatetime.getFullYear() + ' '
                + currentDatetime.getHours() + ":"  
                + (currentDatetime.getMinutes()-1);
    var executeStatement = '(cd /Library/WebServer/Documents/Web/icracked/website; git log --since="' + lastMin + '" --author="Nick Carson" --format=format: --numstat ' + branch_name + ')';
    console.log(executeStatement);
    execute(executeStatement, function(output) {
        var additions = 0;
        var deletions = 0;
        var outputLines = output.split(/\n/);
        var changes = [];
        for (var k=0; k < outputLines.length; k++) {
            // only push this line if it contains a non whitespace character.
            if (/\S/.test(outputLines[k])) {
                var line = outputLines[k].replace(/\t/, ' ').replace('\t', ' ').split(' ');
                if(line[0] == '-') { line[0] = 0 }
                if(line[1] == '-') { line[1] = 0 }
            
                changes.push([parseInt(line[0], 10), parseInt(line[1], 10)] );
            }
        }
        
        for(var k=0; k<changes.length; k++) {
            additions = additions + changes[k][0];
            deletions = deletions + changes[k][1];
        }
        var query = 'INSERT INTO caffeinecoder.code_lines_hourly (user_id, branch_id, lines_added, lines_deleted, date_created) VALUES (1, (SELECT branch_id FROM caffeinecoder.branches WHERE repository_id = 1 AND branch_name = \'' + branch_name + '\'), ' + additions + ', ' + deletions + ', NOW() )';
            
        connection.query(query, function(err, rows, fields) {
            if (err) { console.log(err); }
            else {
                console.log('success');
            }
        });
    });
}

function setTotalLinesForBranch(branch_name, callback) {
    var currentDatetime = new Date(); 
    var lastMin = (currentDatetime.getMonth()+1) + '/'
                + currentDatetime.getDate() + '/'
                + currentDatetime.getFullYear() + ' '
                + currentDatetime.getHours() + ":"  
                + (currentDatetime.getMinutes()-1);
    var executeStatement = '(cd /Library/WebServer/Documents/Web/icracked/website; git log --author="Nick Carson" --format=format: --numstat ' + branch_name + ')';
    console.log(executeStatement);
    execute(executeStatement, function(output) {
        var additions = 0;
        var deletions = 0;
        var outputLines = output.split(/\n/);
        var changes = [];
        for (var k=0; k < outputLines.length; k++) {
            // only push this line if it contains a non whitespace character.
            if (/\S/.test(outputLines[k])) {
                var line = outputLines[k].replace(/\t/, ' ').replace('\t', ' ').split(' ');
                if(line[0] == '-') { line[0] = 0 }
                if(line[1] == '-') { line[1] = 0 }
            
                changes.push([parseInt(line[0], 10), parseInt(line[1], 10)] );
            }
        }
        
        for(var k=0; k<changes.length; k++) {
            additions = additions + changes[k][0];
            deletions = deletions + changes[k][1];
        }
        var query = 'INSERT INTO caffeinecoder.code_lines_total (user_id, branch_id, lines_added, lines_deleted, date_created) VALUES (1, (SELECT branch_id FROM caffeinecoder.branches WHERE repository_id = 1 AND branch_name = \'' + branch_name + '\'), ' + additions + ', ' + deletions + ', NOW() )';
            
        connection.query(query, function(err, rows, fields) {
            if (err) { console.log(err); }
            else {
                console.log('success');
            }
        });
    });
}

setInterval(function() {
    var currentDatetime = new Date(); 

    if( currentDatetime.getSeconds() == 0) {
        setBranches();
    }
}, 1000);

io.sockets.on('connection', function (socket) {
    function getSendAllEvents() {
        var query = 'SELECT e.event_id AS event_id, et.event_name AS event_name, e.date_created AS date_created FROM caffeinecoder.events e LEFT JOIN caffeinecoder.event_types et ON et.event_type_id = e.event_type_id WHERE e.user_id = 1 AND DATE(e.date_created) = DATE(NOW()) ORDER BY e.date_created DESC';
                        
        connection.query(query, function(err, rows, fields) {
            if (err) { throw err; }
            else {
                var events_html = '<table id="todaysEventsTable"><thead><tr><td>Type</td><td>Time</td><td></td></tr></thead><tbody>';
                for(var i = 0; i < rows.length; i++) {
                    var date_created = rows[i].date_created;
                    
                    events_html += '<tr data-event_id="' + rows[i].event_id + '" class="event"><td>' + rows[i].event_name + '</td><td>' + formatAMPM(date_created) + '</td><td><button class="alert round mini deleteEvent">x</button></td></tr>';
                }
                
                events_html += '</tbody></table>';
                
                socket.emit('todays_events', { 'events_html': events_html });
            }
        });
        
        var query = 'SELECT et.event_name AS event_name, e.date_created AS date_created FROM caffeinecoder.events e LEFT JOIN caffeinecoder.event_types et ON et.event_type_id = e.event_type_id WHERE e.user_id = 1 AND DATE(e.date_created) = DATE(NOW()) ORDER BY e.date_created ASC';
                        
        connection.query(query, function(err, rows, fields) {
            if (err) { throw err; }
            else {
                events_data = rows;
                
                socket.emit('todays_events_data', { 'events_data': events_data });
            }
        });
        
        var query = 'SELECT et.event_name AS event_name, e.date_created AS date_created FROM caffeinecoder.events e LEFT JOIN caffeinecoder.event_types et ON et.event_type_id = e.event_type_id WHERE e.user_id = 1 AND DATE(e.date_created) != DATE(NOW()) ORDER BY e.date_created DESC';
                        
        connection.query(query, function(err, rows, fields) {
            if (err) { throw err; }
            else {
                var events_html = '<table id="allEventsTable"><thead><tr><td>Type</td><td>Date</td><td>Time</td></tr></thead><tbody>';
                for(var i = 0; i < rows.length; i++) {
                    var date_created = rows[i].date_created;
                    
                    events_html += '<tr class="event"><td>' + rows[i].event_name + '</td><td>' + date_created.getMonth() + '/' + date_created.getDate() + '/' + date_created.getFullYear() + '</td><td>' + formatAMPM(date_created) + '</td></tr>';
                }
                
                events_html += '</tbody></table>';
                
                socket.emit('all_events', events_html);
            }
        });
    }

    try {
        console.log('User Connected');
        
        connection.query('SELECT * FROM caffeinecoder.event_types', function(err, rows, fields) {
            if (err) { throw err; }
            else {
                console.log('Query results: ', rows);
                
                socket.emit('event_types', rows);
            }
        });
        
        getSendAllEvents();
        
        socket.on('log_event', function(data) {
            console.log(data);
            
            var log_event_query = 'INSERT INTO caffeinecoder.events (event_type_id, user_id, date_created) VALUES (' + data.event_type_id + ', 1, NOW())';
            
            connection.query(log_event_query, function(err, rows, fields) {
                if (err) { throw err; }
                else {
                    getSendAllEvents();
                }
            });
        });
        
        socket.on('delete_event', function(data) {
            console.log(data);
            
            var log_event_query = 'DELETE FROM caffeinecoder.events WHERE event_id = ' + data.event_id;
            
            connection.query(log_event_query, function(err, rows, fields) {
                if (err) { throw err; }
                else {
                    console.log('Deleted ' + data.event_id);
                    getSendAllEvents();
                }
            });
        });
        
        // User Disconnected
        socket.on('disconnect', function () {
            console.log('User Disconnected');
            
        });
        
    } catch (exception) { console.log('ERROR: ' + exception); }
});

function formatAMPM(date) {
    var hours = date.getHours();
    var minutes = date.getMinutes();
    var ampm = hours >= 12 ? 'pm' : 'am';
    hours = hours % 12;
    hours = hours ? hours : 12; // the hour '0' should be '12'
    minutes = minutes < 10 ? '0'+minutes : minutes;
    var strTime = hours + ':' + minutes + ' ' + ampm;
    return strTime;
}


/*
// End MySQL connection
            connection.end(function(err) {
                if (err) { throw err; }
            });
*/

// Find index by attribute in object array
function findByAttr(array, attr, value) {
    for(var i = 0; i < array.length; i += 1) {
        if(array[i][attr] === value) {
            return i;
        }
    }
    
    return -1;
}
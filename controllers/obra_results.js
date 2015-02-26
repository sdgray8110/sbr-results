var http = require('http'),
    moment = require('moment'),
    helpers = require('../helpers');

var OBRA_ResultsController = (function() {
    var self = {
        memberResultsURL: function(obraID, year) {
            var params = [obraID, year].join('/');

            return 'http://obra.org/people/' + params +  '.json';
        },

        memberInfoURL: function(firstname, lastname) {
            var params = [firstname.toLowerCase(), lastname.toLowerCase()].join('+');

            return 'http://obra.org/people.json?name=' + params;
        },

        fetch_results: function(obraID, year, callback) {
            var url = self.memberResultsURL(obraID, year);

            self.fetch(url, function(results) {
                callback(results);

                //callback(self.process_results(results));
            });
        },

        fetch_rider: function(firstname, lastname, callback) {
            var url = self.memberInfoURL(firstname, lastname);

            self.fetch(url, function(rider) {
                callback(self.process_rider(rider));
            });
        },

        fetch: function(url, callback) {
            http.get(url, function(res) {
                var body = '';

                res.on('data', function(chunk) {
                    body += chunk;
                });

                res.on('end', function() {
                    callback(JSON.parse(body))
                });
            }).on('error', function(e) {
                console.log("Got error: ", e);
            });
        },

        process_rider: function(riders) {
            return riders.length ? riders[0] : {};
        },

        process_results: function(results) {
            var eventIDs = [],
                resultSetNames = [],
                clean = [];

            results.data.forEach(function(item, i) {
                var newEventID = eventIDs.indexOf(item.eventId) < 0,
                    newResultSet = resultSetNames.indexOf(item.resultSetName) < 0;

                if (newEventID || (!newEventID && newResultSet)) {
                    clean.push(self.result(item));
                }

                eventIDs.push(item.eventId);
                resultSetNames.push(item.resultSetName);
            });

            return clean;
        },

        result: function(item) {
            var eventDate = self.acaDate(item.eventDate),
                m = moment(eventDate),
                data = {
                    date: parseInt(eventDate / 1000),
                    prettyDate: m.format('MM/DD'),
                    month: m.format('MMMM'),
                    year: m.format('YYYY'),
                    event: item.eventName || '',
                    category: self.acaCategory(item),
                    placing: parseInt(item.resultSetPlace),
                    prettyPlacing: self.prettyPlacing(item),
                    name: self.riderName(item),
                    id: item.eventId,
                    resultsBy: 'aca'
                };

            self.setDiscipline(data);

            return data;
        },

        acaDate: function(dateStr) {
            var arr = dateStr.split('-'),
                formatted = arr[2] + '/' + arr[1] + '/' + arr[0];

            return new Date(formatted);
        },

        acaCategory: function(item) {
            var category = null,
                keys = ['resultSetName', 'raceGroupName', 'category'];

            keys.some(function(key) {
                if (item[key]) {
                    category = item[key];

                    return true;
                }
            });

            return category;
        },

        setDiscipline: function(data) {
            var discipline = '',
                mappings = {
                    'Road': ['road race', ' rr', 'circuit race', 'circuit-race', 'hillclimb', 'hill climb', 'hill-climb', 'road'],
                    'TT': ['time trial', 'time-trial', ' tt'],
                    'Stage Race': ['stage race', 'omnium'],
                    'Criterium': ['criterium', 'crit'],
                    'MTB': ['mtb', 'xc', 'cross country', 'cross-country', 'downhill', 'enduro', 'short track', 'short-track'],
                    'CX': ['cx', 'cyclocross', 'cyclo cross', 'cyclo-cross', 'cyclo x', 'cyclo-x', 'cross']
                },
                disciplines = Object.keys(mappings),
                lcName = data.event.toLowerCase();

            disciplines.some(function(type) {
                var matches = mappings[type].filter(function(shorthand) {
                    return lcName.match(shorthand);
                });

                if (matches.length) {
                    discipline = type;

                    return true;
                }
            });

            data.discipline = discipline;
            data.disciplineClassName = discipline.toLowerCase().replace(/ /g, '_');
        },

        prettyPlacing: function(item) {
            return helpers.ordinal_suffix_of(item.resultSetPlace);
        },

        riderName: function(item) {
            var name = [],
                keys = ['firstName', 'lastName'];

            keys.forEach(function(key) {
                if (item[key]) {
                    name.push(item[key]);
                }
            });

            return name.join(' ');
        }
    };

    return self;
})();

module.exports = OBRA_ResultsController;
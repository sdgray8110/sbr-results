var http = require('http'),
    moment = require('moment'),
    helpers = require('../helpers');

var ACA_ResultsController = (function() {
    var self = {
        memberResultsURL: function(usacID) {
            return 'http://www.coloradocycling.org/services/members/' + usacID + '/results';
        },

        memberDataURL: function(usacID) {
            return 'http://www.coloradocycling.org/services/members/' + usacID;
        },

        fetch_member_data: function(usacID, callback) {
            var url = self.memberDataURL(usacID);

            self.fetch(url, function(memberData) {
                callback(memberData);
            });
        },

        fetch_results: function(usacID, callback) {
            var url = self.memberResultsURL(usacID);

            self.fetch(url, function(results) {
                callback(self.process_results(results));
            });
        },

        fetch: function(url, callback) {
            http.get(url, function(res) {
                var body = '';

                res.on('data', function(chunk) {
                    body += chunk;
                });

                res.on('end', function() {
                    var res = helpers.validJson(body) ? JSON.parse(body) : [];

                    callback(res);
                });
            }).on('error', function(e) {
                console.log("Got error: ", e);
            });
        },

        process_results: function(results) {
            var eventIDs = [],
                resultSetNames = [],
                clean = [];

            if (Array.isArray(results.data)) {
                results.data.forEach(function(item, i) {
                    var newEventID = eventIDs.indexOf(item.eventId) < 0,
                        newResultSet = resultSetNames.indexOf(item.resultSetName) < 0;

                    if (newEventID || (!newEventID && newResultSet)) {
                        clean.push(self.result(item));
                    }

                    eventIDs.push(item.eventId);
                    resultSetNames.push(item.resultSetName);
                });

            }

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

module.exports = ACA_ResultsController;
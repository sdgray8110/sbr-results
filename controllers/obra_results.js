var http = require('http'),
    cheerio = require('cheerio'),
    moment = require('moment'),
    helpers = require('../helpers'),
    minYear = 2006;

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

        memberInfoPageURL: function(obraId) {
            return 'http://obra.org/people/' + obraId;
        },

        fetch_results: function(obraID, year, callback) {
            var url = self.memberResultsURL(obraID, year);

            self.fetch(url, function(results) {
                callback(self.process_results(results));
            });
        },

        fetch_all_results: function(obraID, callback) {
            var years = self.allYears(),
                results = {};

            years.forEach(function(year) {
                var url = self.memberResultsURL(obraID, year);

                self.fetch(url, function(res) {
                    results[year] = self.process_results(res);

                    if (Object.keys(results).length === years.length) {
                        callback(results);
                    }
                });
            });
        },

        fetch_rider: function(firstname, lastname, callback) {
            var url = self.memberInfoURL(firstname, lastname);

            self.fetch(url, function(rider) {
                callback(self.process_rider(rider));
            });
        },


        fetch_rider_info: function(obraId, callback) {
            var url = self.memberInfoPageURL(obraId);

            self.fetchHTML(url, function(rider) {
                callback(self.process_rider_info(rider));
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

        fetchHTML: function(url, callback) {
            http.get(url, function(res) {
                var body = '';

                res.on('data', function(chunk) {
                    body += chunk;
                });

                res.on('end', function() {
                    callback(body);
                });
            }).on('error', function(e) {
                console.log("Got error: ", e);
            });
        },

        allYears: function() {
            var curYear = parseInt(moment().format('YYYY')),
                years = [];

            while (curYear >= minYear) {
                years.push(curYear);
                curYear -= 1;
            }

            return years;
        },

        process_rider: function(riders) {
            return riders.length ? riders[0] : {};
        },

        process_rider_info: function(rider) {
            var $ = cheerio.load(rider),
                data = {
                    mtb_category: $('#person_mtb_category').text(),
                    road_category: $('#person_road_category').text(),
                    cross_category: $('#person_ccx_category').text()
                };

            return data;
        },

        process_results: function(results) {
            var races = []

            results.forEach(function(result) {
                result = self.result(result);

                if (self.isValidRace(result) && self.isValidPlacing(result.placing)) {
                    races.push(result);
                }
            });

            races.sort(self.sort_desc);

            return races;
        },

        result: function(item) {
            var eventDate = new Date(item.date),
                m = moment(eventDate),
                data = {
                    date: item.date,
                    prettyDate: m.format('M/D/YYYY'),
                    month: m.format('MMMM'),
                    year: m.format('YYYY'),
                    timestamp: parseInt((eventDate * 1) / 1000),
                    event: item.race_full_name,
                    category: self.categoryName(item),
                    placing: parseInt(item.place),
                    prettyPlacing: self.prettyPlacing(item),
                    name: item.name,
                    id: item.id
                };

            self.cleanEventName(data);
            self.setDiscipline(data);

            return data;
        },

        isValidRace: function(result) {
            var terms = ['BAR', 'Standings', 'Combined'],
                valid = true;

            terms.some(function(term) {
                if (result.event.match(term) || result.category.match(term)) {
                    valid = false;

                    return false;
                }
            });

            return valid;
        },

        isValidPlacing: function(placing) {
            return placing && placing <= 200;
        },

        categoryName: function(item) {
            var category = '';

            if (item.race_name) {
                category = item.race_name;
            } else {
                category = item.category_name;
            }

            return category;
        },

        prettyPlacing: function(item) {
            return helpers.ordinal_suffix_of(item.place);
        },

        sort_desc: function(a,b) {
            if (a.timestamp > b.timestamp)
                return -1;
            if (a.timestamp < b.timestamp)
                return 1;
            return 0;
        },

        cleanEventName : function(data) {
            data.event = data.event.replace(data.category, '').trim();
        },

        setDiscipline: function(data) {
            var discipline = '',
                mappings = {
                    'Road': ['road race', ' rr', 'circuit race', 'circuit-race', 'hillclimb', 'hill climb', 'hill-climb', 'road', 'thursday nighter', 'champion thursday'],
                    'Time Trial': ['time trial', 'time-trial', ' tt'],
                    'Stage Race': ['stage race', 'omnium'],
                    'Criterium': ['criterium', 'crit' ],
                    'MTB': ['mtb', 'xc', 'cross country', 'cross-country', 'downhill', 'enduro', 'short track', 'short-track'],
                    'Cyclocross': ['cx', 'cyclocross', 'cyclo cross', 'cyclo-cross', 'cyclo x', 'cyclo-x', 'cross']
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
        }
    };

    return self;
})();

module.exports = OBRA_ResultsController;
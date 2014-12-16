var http = require('http'),
    moment = require('moment'),
    cheerio = require('cheerio'),
    helpers = require('../helpers');
    $ = {};

var USAC_ResultsController = (function() {
    var self = {
        memberResultsURL: function(usacID) {
            return 'http://www.usacycling.org/results/?compid=' + + usacID
        },

        fetch_rider_age: function(usacID, callback) {
            var url = self.memberResultsURL(usacID);

            self.fetch(url, function(resultsPage) {
                callback(self.parseAge(resultsPage));
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
                    callback(body);
                });
            }).on('error', function(e) {
                console.log("Got error: ", e);
            });
        },

        parseAge: function(resultsPage) {
            $ = cheerio.load(resultsPage);

            var text = $('#filterform').find('table').eq(0).find('tr').eq(0).find('b').eq(1).text(),
                age = text.match(/^\d+|\d+\b|\d+(?=\w)/g).map(function (v) {return +v;})[0];

            return {
                racingAge: age
            };
        },

        process_results: function(results) {
            $ = cheerio.load(results);

            var racesEls = $('#filterform').find('.homearticleheader'),
                races = [];

            racesEls.each(function() {
                var el = $(this).parents('tr'),
                    race = el.add(el.next());

                races.push(self.result(race));
            });

            return races;
        },

        result: function(race) {
            var eventDate = self.date(race),
                m = moment(eventDate),
                event = race.find('.homearticleheader > a').text()
                category = self.category(race),
                placing = self.placing(race),
                riderName = self.riderName(race),
                data = {
                    date: parseInt(eventDate / 1000),
                    prettyDate: m.format('MM/DD'),
                    month: m.format('MMMM'),
                    year: m.format('YYYY'),
                    event: event,
                    category: category,
                    placing: placing,
                    prettyPlacing: self.prettyPlacing(placing),
                    name: riderName,
                    resultsBy: 'usac'
                };

            self.setDiscipline(race);

            return data;
        },

        date: function(race) {
            var dateStr = race.find('.homearticleheader').text().substring(0,10);

            return new Date(dateStr);
        },

        category: function(race) {
            var arr = [race.find('[title=class]').text().trim(), race.find('[title=age]').text().trim()].filter(function(item) {
                return item.length;
            });

            return arr.join(' | ');
        },

        placing: function(race) {
            return parseInt(race.find('.homearticlebody td').eq(0).text().split('/')[0].trim());
        },

        prettyPlacing: function(placing) {
            var place = parseInt(placing);

            return !isNaN(place) ? helpers.ordinal_suffix_of(place) : placing;
        },

        riderName: function(race) {
            return race.find('.homearticlebody td').eq(2).text().trim();
        },

        setDiscipline: function(race) {
            var discipline = race.find('[title=discipline]').text(),
                mappings = {
                    'Criterium': ['CRIT'],
                    'Road': ['RR', 'CCR'],
                    'TT': ['TT', 'ITT', 'TTT'],
                    'Stage Race': ['OMNI', 'STR', 'GC'],
                    'CX': ['CX'],
                    'MTB': ['STXC', 'XC', 'XC', 'DH']
                },
                disciplines = Object.keys(mappings),
                lcName = discipline.toLowerCase();

            disciplines.some(function(type) {
                var matches = mappings[type].filter(function(shorthand) {
                    return lcName.match(shorthand.toLowerCase());
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

module.exports = USAC_ResultsController;
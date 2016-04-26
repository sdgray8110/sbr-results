var http = require('http'),
    fs = fs = require('fs'),
    riderLisatFile = 'public/data/rdiers.json',
    resultsFile = 'public/data/results.json',
    ResultsController = require('../controllers/results'),
    cronurl = 'http://www.sonicboomracing.com/wp-content/themes/sbr/cron/fetch_saved_results.php';

var CompositeResultsController = (function() {
    var self = {
            save_rider_list: function(riderList, callback) {
                var content = JSON.stringify(riderList);

                self.save_list_to_file(content);
                callback(riderList);
                self.getResults(riderList);
            },
            save_list_to_file: function(content) {
                fs.writeFile(riderLisatFile, content, function (err) {
                    if (err) return console.log(err);
                    //console.log('Data', content);
                });
            },
            save_results_to_file: function(results) {
                fs.writeFile(resultsFile, JSON.stringify(results), function (err) {
                    if (err) return console.log(err);
                    console.log('Data', results);
                });
            },
            getResults: function(riderList) {
                if (!riderList) {
                    self.get_saved_rider_list(function(data) {
                        riderList = data;

                        self.fetchResults(riderList);c
                    });
                }

                self.fetchResults(riderList);
            },
            get_saved_rider_list: function(callback) {
                fs.readFile(riderLisatFile, function (err, data) {
                    if (err) throw err;

                    callback(JSON.parse(data));
                });
            },

            fetchResults: function(riderList) {
                var compositeResults = [],
                    len = riderList.length,
                    processed = 0;

                riderList.forEach(function(rider, i) {
                    if (i <= len) {
                        ResultsController.fetchRider(rider.usac, function(results) {
                            var result = {
                                riderName: rider.riderName,
                                usac: rider.usac,
                                id: rider.id,
                                data: results
                            };
                            compositeResults.push(result);
                            processed += 1;

                            console.log(i, len, processed);

                            if ((processed + 1) === len) {
                                self.save_results_to_file(compositeResults);
                                self.triggerFetchResults();
                            }
                        });
                    }
                });
            },

            saveYearlyCombinedResults: function(riderList, callback) {
                    var years = {};

                riderList.forEach(function (rider) {
                    rider.data.forEach(function(race) {
                        self.singleYearData(years, race);
                    });
                });

                callback(years);
            },


            singleYearData: function (years, race) {
                if (years[race.year]) {
                    years[race.year].races.push(race);
                    years[race.year].stats = self.yearlyStats(years[race.year], race)

                } else {
                    years[race.year] = {
                        stats: self.yearlyStats({}, race),
                        races: [race]
                    };

                    years[race.year].months = {};
                    years[race.year].months[race.month] = [];
                }
                
                if (!years[race.year].months[race.month]) {
                    years[race.year].months = {};
                    years[race.year].months[race.month] = [];
                }
                years[race.year].months[race.month].push(race);
            },

            yearlyStats: function (year, race ) {
                var stats = year.stats || {
                    starts: 0,
                    podiums: 0,
                    wins: 0
                };

                stats.starts += 1;

                if(race.placing <= 3) {
                    stats.podiums += 1;
                }

                if(race.placing === 1) {
                    stats.wins += 1;
                }

                return stats;
            },

            getSavedResults: function(callback) {
                fs.readFile(resultsFile, function (err, data) {
                    if (err) throw err;

                    callback(JSON.parse(data));
                });
            },

            triggerFetchResults: function() {
                http.get(cronurl, function(res) {
                    var body = '';

                    res.on('data', function(chunk) {
                        body += chunk;
                    });

                    res.on('end', function() {
                        if (res.statusCode == '404') {
                            body = '{"error": "trigger fetch results 404"}';
                        }
                    });
                }).on('error', function(e) {
                    console.log("Got error: ", e);
                });
            }
        };

    return self;
})();

module.exports = CompositeResultsController;

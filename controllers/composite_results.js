var fs = fs = require('fs'),
    path = require('path'),
    riderLisatFile = 'public/data/rdiers.json',
    resultsFile = 'public/data/results.json',
    ResultsController = require('../controllers/results');

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

                        self.fetchResults(riderList);
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
                    len = riderList.length;

                riderList.forEach(function(rider, i) {
                    if (i <= len) {
                        ResultsController.fetchRider(rider.usac, function(results) {
                            var result = {
                                usac: rider.usac,
                                id: rider.id,
                                results: results
                            };
                            compositeResults.push(result);

                            console.log(i, len);

                            if ((i + 1) === len) {
                                self.save_results_to_file(compositeResults);
                            }
                        });
                    }
                });
            },

            getSavedResults: function(callback) {
                fs.readFile(resultsFile, function (err, data) {
                    if (err) throw err;

                    callback({'foo': 'moo'});

                    //callback(JSON.parse(data));
                });
            }
        };

    return self;
})();

module.exports = CompositeResultsController;

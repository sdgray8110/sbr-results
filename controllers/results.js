var helpers = require('../helpers'),
    ACA_ResultsController = require('../controllers/aca_results'),
    USAC_ResultsController = require('../controllers/usac_results');

var ResultsController = (function() {
    var self = {
        options: {
            stripNonResults: true
        },

        getCombinedResults: function(req, callback, options) {
            var results = [],
                riders = self.getRiders(req),
                len = riders.length;

            self.options = helpers.extend(self.options, options);

            riders.forEach(function(rider, i) {
                self.fetchRider(rider.usac, function(riderResults) {
                    var data = {};
                    data[rider.id] = riderResults;

                    results.push(data);

                    if (i === (len - 1)) {
                        callback(results);
                    }
                });
            });

        },

        getRiders: function(req) {
            var defaultRiders = [
                    {usac: 347366, id: 1},
                    {usac: 388671, id: 2}
                ],
                riders = req.params.riders ? self.get_riders_from_params(req.params.riders) :  defaultRiders;

            return riders;
        },

        get_riders_from_params: function(riderList) {
            var list = riderList.split(',');

            list.forEach(function(rider, i) {
                var item = rider.split('|');

                list[i] = {
                    usac: item[0], id: item[1]
                };
            });

            return list;
        },

        fetchRider: function(usacId, callback) {
            ACA_ResultsController.fetch_results(usacId, function(aca) {
                USAC_ResultsController.fetch_results(usacId, function(usac) {
                    var nestedResults = {
                            acaResults: aca,
                            usacResults: usac
                        },
                        combined_and_deduped = self.combined_and_dedupe(nestedResults);

                    callback(combined_and_deduped);
                });
            });
        },

        combined_and_dedupe: function(results) {
            results.usacResults = results.usacResults.filter(function(usacResult) {
                return (function() {
                    var unique = true;

                    results.acaResults.some(function(acaResult) {
                        if ((usacResult.date === acaResult.date) && (usacResult.placing === acaResult.placing)) {
                            unique = false;

                            return true;
                        }
                    });

                    return unique;
                })();
            });

            var combined = results.acaResults.concat(results.usacResults).sort(function(a,b) {
                if (a.date > b.date) {
                    return -1;
                }
                if (a.date < b.date) {
                    return 1;
                }

                return 0;
            });

            return self.stripNonResults(combined);
        },

        stripNonResults: function(results) {
            if (self.options.stripNonResults) {
                var nonResult = ['dns','dnf', 'dnp', 'dq'],
                    maxPlacing = 599;
                    
                nonResult.forEach(function(item) {
                	var upper = item.toUpperCase();
                
                	if (nonResult.indexOf(upper) < 0) {
                		nonResult.push(upper);
                	}
                });

                results = results.filter(function(result) {
                    if (nonResult.indexOf(result.placing) < 0 && result.placing <= maxPlacing) {
                        return true;
                    }
                });
            }

            return results;
        }
    };

    return self;
})();

module.exports = ResultsController;

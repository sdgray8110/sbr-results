var helpers = require('../helpers'),
    ACA_ResultsController = require('../controllers/aca_results'),
    USAC_ResultsController = require('../controllers/usac_results');

var RiderDataController = (function() {
    var self = {
        get_rider: function(usacID, callback) {
            ACA_ResultsController.fetch_member_data(usacID, function(acaData) {
                USAC_ResultsController.fetch_rider_age(usacID, function(usacData) {
                    var processed = self.process(acaData, usacData);

                    callback(processed);
                });
            });
        },

        get_riders: function(id_list, callback) {
            var ids = id_list.split(','),
                len = ids.length,
                riders = [],
                processedCt = 0;

            ids.forEach(function(id, i) {
                self.get_rider(id, function(rider) {
                    riders.push(rider);
                    processedCt += 1;

                    if (processedCt === len) {
                        callback(riders);
                    }
                });
            });
        },

        process: function(acaData, usacData) {
            var map = {
                    'RD': 'roadCategory',
                    'CX': 'crossCategory',
                    'TR': 'trackCategory',
                    'MTB': 'mtbCategory'
                },
                cats = Object.keys(map);

            if (Array.isArray(acaData.data) && acaData.data.length) {
                var data = helpers.extend(acaData.data[0], usacData);

                cats.forEach(function(cat) {
                    data[map[cat]] = data.credentials[cat];
                });

                delete(data.credentials);
                delete(data.clubs);

                return data;
            }

            return usacData;
        }
    };

    return self;
})();

module.exports = RiderDataController;
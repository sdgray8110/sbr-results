var helpers = require('../helpers'),
    ACA_ResultsController = require('../controllers/aca_results'),
    USAC_ResultsController = require('../controllers/usac_results');

var RiderDataController = (function() {
    var self = {
        get_rider: function(usacID, callback) {
            ACA_ResultsController.fetch_member_data(usacID, function(acaData) {
                USAC_ResultsController.fetch_rider_age(usacID, function(usacData) {
                    callback(self.process(acaData, usacData));
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
                cats = Object.keys(map),
                data = helpers.extend(acaData.data[0], usacData);

            cats.forEach(function(cat) {
                data[map[cat]] = data.credentials[cat];
            });

            delete(data.credentials);
            delete(data.clubs);

            return data;
        }
    };

    return self;
})();

module.exports = RiderDataController;
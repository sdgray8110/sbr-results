 var express = require('express');
var router = express.Router();
var ResultsController = require('../controllers/results');
var ACA_ResultsController = require('../controllers/aca_results');
var USAC_ResultsController = require('../controllers/usac_results');
var OBRA_ResultsController = require('../controllers/obra_results');
var RiderDataController = require('../controllers/rider_data');
var CompositeResultsController = require('../controllers/composite_results');


router.post('/', function(req, res) {
  var riders = JSON.parse(req.body.riders);

  ResultsController.getCombinedResults(riders, function(results) {
    res.json(results);
  });
});

router.get('/:id(\\d+)/', function(req, res) {
  ResultsController.fetchRider(req.params.id, function(results) {
    res.json(results);
  });
});

router.get('/', function(req, res) {
  ResultsController.getCombinedResults(req, function(results) {
    res.json(results);
  });
});

router.get('/rider_results/:riders', function(req, res) {
  ResultsController.getCombinedResults(req, function(results) {
    res.json(results);
  });
});

router.get('/aca', function(req, res) {
  ACA_ResultsController.fetch_results(347366, function(results) {
    res.json(results);
  });
});

router.get('/usac', function(req, res) {
  USAC_ResultsController.fetch_results(388671, function(results) {
    res.json(results);
  });
});

router.get('/rider/:id', function(req, res) {
  RiderDataController.get_rider(req.params.id, function(data) {
    res.json(data);
  });
});


router.get('/riders/:ids', function(req, res) {
  RiderDataController.get_riders(req.params.ids, function(data) {
    res.json(data);
  });
});

// OBRA
router.get('/obra/rider/:firstname/:lastname', function(req, res) {
  OBRA_ResultsController.fetch_rider(req.params.firstname, req.params.lastname, function(data) {
    res.json(data);
  });
});

router.get('/obra/results/:id/:year', function(req, res) {
  OBRA_ResultsController.fetch_results(req.params.id, req.params.year, function(data) {
    res.json(data);
  });
});

router.get('/obra/results-all/:id', function(req, res) {
  OBRA_ResultsController.fetch_all_results(req.params.id, function(data) {
    res.json(data);
  });
});

router.get('/obra/rider-info/:id', function(req, res) {
  OBRA_ResultsController.fetch_rider_info(req.params.id, function(data) {
    res.json(data);
  });
});

 router.get('/usacs', function(req, res) {
   var data = {
     'foo': 'moo'
   };

   res.json(data);
 });

router.post('/save_riders/', function(req, res) {
  CompositeResultsController.save_rider_list(req.body.riders, function(data) {
    res.json(data);
  });
});

module.exports = router;

var express = require('express');
var router = express.Router();
var ResultsController = require('../controllers/results');
var ACA_ResultsController = require('../controllers/aca_results');
var USAC_ResultsController = require('../controllers/usac_results');
var OBRA_ResultsController = require('../controllers/obra_results');
var RiderDataController = require('../controllers/rider_data');


router.post('/', function(req, res) {
  var riders = JSON.parse(req.body.riders);

  ResultsController.getCombinedResults(riders, function(results) {
    res.json(results);
  });
});

router.get('/:id', function(req, res) {
  ResultsController.fetchRider(req.params.id, function(results) {
    res.json(results);
  });
});

router.get('/', function(req, res) {
  var riders = [
    {usac: 347366, id: 1},
    {usac: 388671, id: 2}
  ];

  ResultsController.getCombinedResults(riders, function(results) {
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

router.get('/favicon.ico', function(req, res) {
  var img = fs.readFileSync('/public/favicon.ico');
  res.writeHead(200, {'Content-Type': 'image/ico' });
  res.end(img, 'binary');
});

module.exports = router;

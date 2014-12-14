var express = require('express');
var router = express.Router();
var ResultsController = require('../controllers/results');
var ACA_ResultsController = require('../controllers/aca_results');
var USAC_ResultsController = require('../controllers/usac_results');


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

module.exports = router;

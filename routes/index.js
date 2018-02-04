var express = require('express');
var router = express.Router();
var csv = require("fast-csv");

//get homepage
router.get('/', ensureAuthenticated, function(req, res){
  res.render('index', {
    locations: dataLocations
  });
});

function ensureAuthenticated(req, res, next){
  if(req.isAuthenticated()){
    return next();
  } else {
    //req.flash('error_msg', 'You are not logged in');
    res.redirect('/users/login');
  }
}

var dataLocations = [];
csv.fromPath("location", {headers: ["id", "name", , , , , ,]}) .on("data", data => {
  dataLocations.push(data);
});

module.exports = router;

var bodyParser = require('body-parser');
var express = require('express');
var router = express.Router();
const AdwordsUser = require('node-adwords').AdwordsUser;
const AdwordsConstants = require('node-adwords').AdwordsConstants;

//get contents
router.post('/getcontent', function(req, res){
    console.log('Getting content...');

    var keyword_list = req.body.keywords.split('\n');
    keyword_list.map(Function.prototype.call, String.prototype.trim);
    var current_location = req.body.location;

    //console.log(`Keywords >${JSON.stringify(keyword_list)}< Location >${current_location}<`);

    let user = new AdwordsUser({
      developerToken: 'y8pfHzdjWo8GE-H9-T4RBQ',
      userAgent: 'Test',
      clientCustomerId: '538-847-8739',
      client_id: '498607192120-7en5t9np9078g5gv4d4k187h7gpj34qr.apps.googleusercontent.com',
      client_secret: 'JALg1kuxVjHMhnJohUBJ1i5K',
      refresh_token: '1/kZVouzUV-wgPFdq6BuJ0iHM8hHffJqRi3RJJfs6xhs8',
    });

    sliceKeyword(keyword_list, current_location, user, 0, 500, function (err, results) {
      console.log('Sending content...');

      if(err){
        res.status(500).send({
          data: []
        });
      }else{
        res.status(200).send({
          data: results
        });
      }
    });
});

//post user
router.post('/content', function(req, res){
  res.render('content', { keywords: req.body.keywords, location: req.body.location });
});

module.exports = router;

function parseData(keywordlist, result) {
  var entry_len = 0;
  for(var xx = 0; xx < result.totalNumEntries; xx++){
    var entry = result.entries[xx];

    var item = {};
    entry_len =  entry.data.length;
    for(var yy = 0; yy < entry.data.length; yy++){
      var data = entry.data[yy];

      if (data.key == 'KEYWORD_TEXT') {
        item.keyword_text = data.value.value;
      } else if (data.key == 'SEARCH_VOLUME') {
        item.search_volume = data.value.value == null ? 'N/A' : data.value.value;
      } else if (data.key == "AVERAGE_CPC") {
        item.average_cpc = data.value.value == null ? 'N/A' : '$' + (data.value.value.microAmount / 1000000).toFixed(2);
      } else if(data.key == "COMPETITION") {
        item.competition = data.value.value == null ? 'N/A' :(data.value.value * 1).toFixed(2);
      }
    }

    //console.log(`${JSON.stringify(item)}`);

    keywordlist.unshift(item);
  }

  console.log(`total num entries: ${result.totalNumEntries}, ${entry_len}`);
}

function sliceKeyword(keywords, location, user, index, length, cb){
  if(keywords.length > index){
    var keyword_slice = keywords.slice(index, index + length );

    console.log(`Getting (${index}, ${length})`);

    let selector = {
      searchParameters: [{
        'xsi:type': 'RelatedToQuerySearchParameter',
        queries: keyword_slice
      }, {
        'xsi:type': 'LanguageSearchParameter',
        languages: [{'cm:id': 1000}]
      }, {
        'xsi:type': 'LocationSearchParameter',
        locations: [{'cm:id': location}]
      }],
      ideaType: 'KEYWORD',
      requestType: 'STATS',
      requestedAttributeTypes: ['KEYWORD_TEXT', 'SEARCH_VOLUME', 'AVERAGE_CPC', 'COMPETITION'],
      paging: {
        startIndex: 0,
        numberResults: AdwordsConstants.RECOMMENDED_PAGE_SIZE
      },
    };

      var targetingIdeaService = user.getService('TargetingIdeaService', 'v201710');
      targetingIdeaService.get({selector: selector}, (error, result) => {
        if(!error){
          //console.log(`TargetingIdea result ${JSON.stringify(result, 0, 4)}`);
          
          sliceKeyword(keywords, location, user, index + length, length, function(_err, _res){
            if(_err){
              parseData(_res, result);
              cb(_err, _res);
            }else{
              parseData(_res, result);
              cb(null, _res);
            }
          });
        }else{
          try{
            if(error.root.Envelope.Body.Fault.detail.ApiExceptionFault.errors.reason == "RATE_EXCEEDED"){
              setTimeout(function(){
                //-- Retry again
                console.log(`TargetingIdea retry`);
                sliceKeyword(keywords, location, user, index, length, function(_err, _res){
                  if(_err){
                    parseData(_res, result);
                    cb(_err, _res);
                  }else{
                    parseData(_res, result);
                    cb(null, _res);
                  }
                });
              }, error.root.Envelope.Body.Fault.detail.ApiExceptionFault.errors.retryAfterSeconds * 1000);
            }else{
              console.log(`TargetingIdea error ${JSON.stringify(error)}`);
              cb(err, []);
            }
          }catch(err){
            err.inner_err = error;
            console.log(`TargetingIdea error ${JSON.stringify(error)}`);
            cb(err, []);
          }
        }
      });
  } else {
    cb(null, []);
  }
}

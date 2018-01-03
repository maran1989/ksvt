var bodyParser = require('body-parser');
var express = require('express');
var router = express.Router();
const AdwordsUser = require('node-adwords').AdwordsUser;
const AdwordsConstants = require('node-adwords').AdwordsConstants;
var keyword_ideas;
//get contents
router.get('/content', function(req, res){
  res.render('content', {
    keywords: keyword_ideas
  });
});

//post user
router.post('/content', function(req, res){
    var keyword_list = req.body.keywords.split('\r\n');

    let user = new AdwordsUser({
      developerToken: 'y8pfHzdjWo8GE-H9-T4RBQ',
      userAgent: 'Test',
      clientCustomerId: '538-847-8739',
      client_id: '498607192120-7en5t9np9078g5gv4d4k187h7gpj34qr.apps.googleusercontent.com',
      client_secret: 'JALg1kuxVjHMhnJohUBJ1i5K',
      refresh_token: '1/kZVouzUV-wgPFdq6BuJ0iHM8hHffJqRi3RJJfs6xhs8',
    });

    let targetingIdeaService = user.getService('TargetingIdeaService', 'v201710');
    let selector = {
      searchParameters: [{
        'xsi:type': 'RelatedToQuerySearchParameter',
        queries: keyword_list
      }, {
        'xsi:type': 'LanguageSearchParameter',
        languages: [{'cm:id': 1000}]
      }],
      ideaType: 'KEYWORD',
      requestType: 'STATS',
      requestedAttributeTypes: ['KEYWORD_TEXT', 'SEARCH_VOLUME'],
      paging: {
        startIndex: 0,
        numberResults: AdwordsConstants.RECOMMENDED_PAGE_SIZE
      },
    };

    targetingIdeaService.get({selector: selector}, (error, result) => {
        keyword_ideas = JSON.parse(JSON.stringify(result, null, 4));
        console.log(JSON.stringify(result, null, 4));
       res.redirect('/keywords/content');
    });
});

module.exports = router;

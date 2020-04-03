var express = require("express");
var router = express.Router();
const logger = require("../config/winston");
var Crawler = require("crawler");

var c = new Crawler({
  maxConnections: 10,
  // This will be called for each crawled page
  callback: function(error, res, done) {
    if (error) {
      logger.error(error);
    } else {
      var $ = res.$;
      // $ is Cheerio by default
      //a lean implementation of core jQuery designed specifically for the server
      console.log($("title").text());
    }
    done();
  }
});

/**
 * Delete this result for this childKey
 */
router.delete("/:parentKey/:childKey", function(req, res, next) {
  let parentKey = request.params.parentKey;
  let childKey = request.params.childKey;
  res.send({ result: "ok" });
});

/**
 * Delete this result for this parentKey
 */
router.delete("/:parentKey", function(req, res, next) {
  let parentKey = request.params.parentKey;
  res.send({ result: "ok" });
});

/**
 * Conbine and return results for these keys
 */
router.post("/", function(req, res, next) {
  let targetKeysConfig = req.body;
  let keysArray = targetKeysConfig.keys;
  res.send({ result: "ok" });
});

/* Scrape using config */
router.post("/test-scrape", function(req, res, next) {
  let config = req.body;
  // {
  //   "parentKey": "huggies",
  //   "childKey": "faq-us",
  //   "cron": "0 0 15 * *",  // min hour day-of-month month day-of-week
  //   "url": "https://www.huggies.com/en-us/faq/question/",
  //   "rules": {
  //     "iterSelector": "div.article_content_wrapper",
  //     "question": {
  //       "selector": ".seo-art-h2",
  //       "isHtml": false
  //     },
  //     "answer": {
  //       "selector": "p",
  //       "isHtml": true
  //     }
  //   }
  // }
  let results = {
    key: config.key,
    date: new Date().getTime(),
    config: config,
    results: []
  };

  c.queue([
    {
      uri: config.url,
      jQuery: true,

      // The global callback won't be called
      callback: function(error, scrapeRes, done) {
        handScrapeResponse(error, scrapeRes, config, results, res);
        done();
      }
    }
  ]);
});

/* Scrape using config */
router.post("/scrape", function(req, res, next) {
  let config = req.body;
  // {
  //   "parentKey": "huggies",
  //   "childKey": "faq-us",
  //   "cron": "0 0 15 * *",  // min hour day-of-month month day-of-week
  //   "url": "https://www.huggies.com/en-us/faq/question/",
  //   "rules": {
  //     "iterSelector": "div.article_content_wrapper",
  //     "question": {
  //       "selector": ".seo-art-h2",
  //       "isHtml": false
  //     },
  //     "answer": {
  //       "selector": "p",
  //       "isHtml": true
  //     }
  //   }
  // }
  let results = {
    key: config.key,
    date: new Date().getTime(),
    config: config,
    results: []
  };

  c.queue([
    {
      uri: config.url,
      jQuery: true,

      // The global callback won't be called
      callback: function(error, scrapeRes, done) {
        if (error) {
          logger.error(error);
        } else {
          var jQuery = scrapeRes.$;
          jQuery(config.rules.iterSelector).each(function(i, elem) {
            let qa = {};
            let qElem = jQuery(this).find(config.rules.question.selector);
            qa.question = config.rules.question.isHtml
              ? qElem.html()
              : qElem.text();

            let aElem = jQuery(this).find(config.rules.answer.selector);

            qa.answer = config.rules.answer.isHtml
              ? aElem.html()
              : aElem.text();

            if (qa.question && qa.answer) {
              results.results.push(qa);
            }
          });
          res.send(results);
        }
        done();
      }
    }
  ]);
});

module.exports = router;
function handScrapeResponse(error, scrapeRes, config, results, res) {
  if (error) {
    logger.error(error);
  } else {
    var jQuery = scrapeRes.$;
    jQuery(config.rules.iterSelector).each(function(i, elem) {
      let qa = {};
      let qElem = jQuery(this).find(config.rules.question.selector);
      qa.question = config.rules.question.isHtml ? qElem.html() : qElem.text();
      let aElem = jQuery(this).find(config.rules.answer.selector);
      qa.answer = config.rules.answer.isHtml ? aElem.html() : aElem.text();
      if (qa.question && qa.answer) {
        results.results.push(qa);
      }
    });
    res.send(results);
  }
}

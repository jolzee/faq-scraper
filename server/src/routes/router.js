require("dotenv").config();
var cron = require("node-cron");
var absolutify = require("absolutify");
var url = require("url");
var express = require("express");
var router = express.Router();
router.delete;
const logger = require("../config/winston");
var Crawler = require("crawler");
var Redis = require("ioredis");
var pretty = require("pretty");
var redis = new Redis({
  port: parseInt(process.env.REDIS_PORT), // Redis port
  host: process.env.REDIS_HOST, // Redis host
  family: 4, // 4 (IPv4) or 6 (IPv6)
  password: process.env.REDIS_PASSWORD,
  db: 0,
});

let cronTasks = [];

const getConfig = (parentKey, childKey) => {
  return redis.hget("faq-configs", `${parentKey}/${childKey}`);
};

const getResults = (parentKey, childKey) => {
  return redis.hget("faq-results", `${parentKey}/${childKey}`);
};

const getAllConfigs = () => {
  return redis.hvals("faq-configs");
};

const scheduleCronJobs = () => {
  logger.debug(`Refreshing CRON Jobs`);
  cronTasks = [];
  getAllConfigs().then((configs) => {
    configs.forEach((config) => {
      try {
        config = JSON.parse(config);
        if (cron.validate(config.cron)) {
          var task = cron.schedule(config.cron, () => {
            logger.debug(`CRON: Time to refresh`, config);
            refreshResults(config);
          });
          cronTasks.push(task);
        }
      } catch (e) {
        logger.error(`CRON: Bad config: config`);
      }
    });
  });
};

const refreshResults = (config) => {
  logger.debug(`Refreshing.. ${config.parentKey} ${config.childKey}`);
  try {
    handleScrape(config)
      .then((results) => {
        saveResults(results);
        saveConfig(config);
      })
      .catch((error) => {
        logger.error(`Unable to CRON Refresh: ${error.message}`, config);
      });
  } catch (e) {
    logger.error(`Unable to CRON Refresh: ${e.message}`, config);
  }
};

const saveConfig = (config) => {
  redis.hset(
    "faq-configs",
    `${config.parentKey}/${config.childKey}`,
    JSON.stringify(config)
  );
  setTimeout(() => {
    cronTasks.forEach((task) => {
      task.destroy();
    });
    scheduleCronJobs();
  }, 120000);
};

const deleteConfig = (config) => {
  return redis.hdel("faq-configs", `${config.parentKey}/${config.childKey}`);
};

const deleteConfigKey = (parentKey, childKey) => {
  return redis.hdel("faq-configs", [`${parentKey}/${childKey}`]);
};

const saveResults = (results) => {
  return redis.hset(
    "faq-results",
    `${results.config.parentKey}/${results.config.childKey}`,
    JSON.stringify(results)
  );
};

const deleteResults = (results) => {
  return redis.hdel(
    "faq-results",
    `${results.config.parentKey}/${results.config.childKey}`
  );
};

const deleteResultsKey = (parentKey, childKey) => {
  return redis.hdel("faq-results", `${parentKey}/${childKey}`);
};

var c = new Crawler({
  maxConnections: 10,
  // This will be called for each crawled page
  callback: function (error, res, done) {
    if (error) {
      logger.error(error);
    } else {
      var $ = res.$;
      // $ is Cheerio by default
      //a lean implementation of core jQuery designed specifically for the server
      console.log($("title").text());
    }
    done();
  },
});

function sortConfigs(a, b) {
  var x = `${a.parentKey.toLowerCase()}${a.childKey.toLowerCase()}`;
  var y = `${b.parentKey.toLowerCase()}${b.childKey.toLowerCase()}`;
  return x < y ? -1 : x > y ? 1 : 0;
}

/**
 * Delete this result for this parentKey
 */
router.delete("/config/:parentKey/:childKey", function (req, res, next) {
  let parentKey = req.params.parentKey;
  let childKey = req.params.childKey;
  deleteConfigKey(parentKey, childKey).then((result) => {
    if (result > 0) {
      deleteResultsKey(parentKey, childKey).then((result) => {
        res.send({ result: "ok" });
      });
    } else {
      res.send({ result: "nothing to delete" });
    }
  });
});

router.delete("/results/:parentKey/:childKey", function (req, res, next) {
  let parentKey = req.params.parentKey;
  let childKey = req.params.childKey;
  deleteResultsKey(parentKey, childKey).then((result) => {
    if (result > 0) {
      res.send({ result: "ok" });
    } else {
      res.send({ result: "nothing to delete" });
    }
  });
});

router.get("/results/:parentKey/:childKey", function (req, res, next) {
  let parentKey = req.params.parentKey;
  let childKey = req.params.childKey;
  getResults(parentKey, childKey).then((result) => {
    if (result) {
      res.send(JSON.parse(result, null, 2));
    } else {
      res.send({ results: [] });
    }
  });
});

router.get("/config/:parentKey/:childKey", function (req, res, next) {
  let parentKey = req.params.parentKey;
  let childKey = req.params.childKey;
  getConfig(parentKey, childKey).then((result) => {
    if (result) {
      res.send(JSON.parse(result, null, 2));
    } else {
      res.send({ results: [] });
    }
  });
});

router.post("/save-config", function (req, res, next) {
  let config = req.body;
  saveConfig(config);
  res.send({ result: "ok" });
});

router.post("/delete-config", function (req, res, next) {
  let config = req.body;
  deleteConfig(config);
  res.send({ result: "ok" });
});

router.get("/all-configs", function (req, res, next) {
  let allConfigs = [];
  getAllConfigs()
    .then((results) => {
      results.forEach((result) => {
        allConfigs.push(JSON.parse(result, null, 2));
      });
      allConfigs.sort(sortConfigs);
      res.send(allConfigs);
    })
    .catch((err) => {
      res.send({ result: err.message });
    });
});

/**
 * Conbine and return results for these keys
 */
router.post("/combine-results", async function (req, res, next) {
  let targetKeysConfig = req.body;
  let combined = [];
  for (const target of targetKeysConfig) {
    let result = await getResults(target.parentKey, target.childKey);
    combined.push(JSON.parse(result, null, 2));
  }
  res.send(combined);
});

/* Scrape using config */
router.post("/test-scrape", function (req, res, next) {
  let config = req.body;

  let emptyResults = {
    date: new Date().toUTCString(),
    config: config,
    results: [],
  };

  handleScrape(config)
    .then((results) => {
      res.send(results);
    })
    .catch((error) => {
      emptyResults.error = error.message;
      res.send(emptyResults);
    });
});

/* Scrape using config */
router.post("/scrape", function (req, res, next) {
  let config = req.body;

  let emptyResults = {
    date: new Date().toUTCString(),
    config: config,
    results: [],
  };

  handleScrape(config)
    .then((results) => {
      saveResults(results);
      saveConfig(config);
      res.send(results);
    })
    .catch((error) => {
      emptyResults.error = error.message;
      res.send(emptyResults);
    });
});

function handleScrape(config) {
  // {
  //   "parentKey": "huggies",
  //   "childKey": "faq-us",
  //   "cron": "0 0 15 * *",  // min hour day-of-month month day-of-week
  //   "url": "https://www.huggies.com/en-us/faq/question/",
  //   "rules": {
  //     "iterSelector": "div.article_content_wrapper",
  //
  //     "question": {
  //       "selector": ".seo-art-h2",
  //       "isHtml": false
  //     },
  //     "answer": {
  //       "adjacentToQuestion": true,
  //       "selector": "p",
  //       "isHtml": true
  //     }
  //   }
  // }
  let results = {
    date: new Date().toUTCString(),
    config: config,
    results: [],
  };

  return new Promise((resolve, reject) => {
    try {
      c.queue([
        {
          uri: config.url,
          jQuery: true,

          callback: function (error, scrapeRes, done) {
            var q = url.parse(config.url, true);
            let site = q.protocol + "//" + q.host;
            results.results = [];
            if (error) {
              reject(error);
            } else {
              var jQuery = scrapeRes.$;
              if (config.rules.answer.adjacentToQuestion) {
                jQuery(config.rules.iterSelector).each(function (i, elem) {
                  jQuery(elem)
                    .find(config.rules.question.selector)
                    .each(function (qi, qElem) {
                      let qa = {};
                      qa.question = config.rules.question.isHtml
                        ? jQuery(qElem).html()
                        : jQuery(qElem).text();

                      cleanQuestion(qa);

                      let aElem = jQuery(qElem).nextUntil(
                        config.rules.question.selector
                      );
                      qa.answer = config.rules.answer.isHtml
                        ? jQuery(aElem).html()
                        : jQuery(aElem).text();

                      cleanAnswer(qa);

                      if (qa.question && qa.answer) {
                        fixRelativeUrls(qa, site);
                        results.results.push(qa);
                      }
                    });
                });
              } else {
                jQuery(config.rules.iterSelector).each(function (i, elem) {
                  let qa = {};
                  let qElem = jQuery(this).find(config.rules.question.selector);

                  qa.question = config.rules.question.isHtml
                    ? jQuery(qElem).html()
                    : jQuery(qElem).text();

                  let aElem = jQuery(this).find(config.rules.answer.selector);
                  qa.answer = config.rules.answer.isHtml
                    ? jQuery(aElem).html()
                    : jQuery(aElem).text();
                  cleanQuestion(qa);
                  cleanAnswer(qa);

                  if (qa.question && qa.answer) {
                    fixRelativeUrls(qa, site);
                    results.results.push(qa);
                  }
                });
              }
              resolve(results);
              done();
            }
          },
        },
      ]);
    } catch (e) {
      reject(e);
    }
  });

  function fixRelativeUrls(qa, site) {
    if (config.rules.question.isHtml) {
      qa.question = absolutify(qa.question, site);
    }
    if (config.rules.answer.isHtml) {
      qa.answer = absolutify(qa.answer, site);
    }
  }

  function cleanAnswer(qa) {
    if (qa.answer === "null") {
      qa.answer = null;
      return;
    }
    if (qa.answer) {
      qa.answer = qa.answer.trim();
      if (config.rules.answer.isHtml) {
        qa.answer = pretty(
          `<span class='faq-scraper-answer'>${qa.answer}</span>`,
          {
            ocd: true,
          }
        );
      }
    }
  }

  function cleanQuestion(qa) {
    if (qa.question === "null" || !qa.question) {
      qa.question = null;
      return;
    }
    if (qa.question) {
      qa.question = qa.question.trim();
      if (config.rules.question.isHtml) {
        qa.question = pretty(
          `<span class='faq-scraper-question'>${qa.question}</span>`,
          { ocd: true }
        );
      }
    }
  }
}

scheduleCronJobs();

module.exports = router;

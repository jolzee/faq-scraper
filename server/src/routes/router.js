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
    let results = {
      date: new Date().toUTCString(),
      config: config,
      results: [],
    };

    c.queue([
      {
        uri: config.url,
        jQuery: true,

        // The global callback won't be called
        callback: function (error, scrapeRes, done) {
          if (error) {
            logger.error(error);
          } else {
            var q = url.parse(config.url, true);
            let site = q.protocol + "//" + q.host;
            var jQuery = scrapeRes.$;
            jQuery(config.rules.iterSelector).each(function (i, elem) {
              let qa = {};
              let qElem = jQuery(this).find(config.rules.question.selector);
              qa.question = config.rules.question.isHtml
                ? absolutify(`<p>${qElem.html()}</p>`, site)
                : qElem.text();

              let aElem = jQuery(this).find(config.rules.answer.selector);

              qa.answer = config.rules.answer.isHtml
                ? absolutify(`<p>${aElem.html()}</p>`, site)
                : aElem.text();

              qa.question = qa.question.trim();
              qa.answer = qa.answer.trim();

              if (qa.question && qa.answer) {
                results.results.push(qa);
              }
            });
            saveResults(results);
            saveConfig(config);
          }
          done();
        },
      },
    ]);
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
    date: new Date().toUTCString(),
    config: config,
    results: [],
  };

  c.queue([
    {
      uri: config.url,
      jQuery: true,

      // The global callback won't be called
      callback: function (error, scrapeRes, done) {
        handleScrapeResponse(error, scrapeRes, config, results, res);
        done();
      },
    },
  ]);
});

/* Scrape using config */
router.post("/scrape", function (req, res, next) {
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
    date: new Date().toUTCString(),
    config: config,
    results: [],
  };

  c.queue([
    {
      uri: config.url,
      jQuery: true,

      // The global callback won't be called
      callback: function (error, scrapeRes, done) {
        if (error) {
          logger.error(error);
        } else {
          var q = url.parse(config.url, true);
          let site = q.protocol + "//" + q.host;
          var jQuery = scrapeRes.$;
          jQuery(config.rules.iterSelector).each(function (i, elem) {
            let qa = {};
            let qElem = jQuery(this).find(config.rules.question.selector);
            qa.question = config.rules.question.isHtml
              ? absolutify(`<p>${qElem.html()}</p>`, site)
              : qElem.text();

            let aElem = jQuery(this).find(config.rules.answer.selector);

            qa.answer = config.rules.answer.isHtml
              ? absolutify(`<p>${aElem.html()}</p>`, site)
              : aElem.text();

            qa.question = qa.question.trim();
            qa.answer = qa.answer.trim();

            // var siteURL = "http://" + top.location.host.toString();
            // var $internalLinks = $("a[href^='"+siteURL+"'], a[href^='/'], a[href^='./'], a[href^='../'], a[href^='#']");

            if (qa.question && qa.answer) {
              results.results.push(qa);
            }
          });
          saveResults(results);
          saveConfig(config);
          res.send(results);
        }
        done();
      },
    },
  ]);
});

function handleScrapeResponse(error, scrapeRes, config, results, res) {
  var q = url.parse(config.url, true);
  let site = q.protocol + "//" + q.host;
  results.results = [];
  if (error) {
    logger.error(error);
  } else {
    var jQuery = scrapeRes.$;
    jQuery(config.rules.iterSelector).each(function (i, elem) {
      let qa = {};
      let qElem = jQuery(this).find(config.rules.question.selector);
      qa.question = config.rules.question.isHtml
        ? absolutify(`<p>${qElem.html()}</p>`, site)
        : qElem.text();
      let aElem = jQuery(this).find(config.rules.answer.selector);
      qa.answer = config.rules.answer.isHtml
        ? absolutify(`<p>${aElem.html()}</p>`, site)
        : aElem.text();
      qa.question = qa.question.trim();
      qa.answer = qa.answer.trim();

      if (qa.question && qa.answer) {
        results.results.push(qa);
      }
    });
    res.send(results);
  }
}

scheduleCronJobs();

module.exports = router;

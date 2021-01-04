require("dotenv").config();
const hookStd = require("hook-std");
var requireFromString = require("require-from-string");
var cron = require("node-cron");
var absolutify = require("absolutify");
var url = require("url");
var express = require("express");
var router = express.Router();
const logger = require("../config/winston");
var Crawler = require("crawler");
var Redis = require("ioredis");
var pretty = require("pretty");
const { format } = require("@fast-csv/format");
var replaceall = require("replaceall");
var redis = null;

try {
  if (process.env.REDIS_PORT) {
    redis = new Redis({
      port: parseInt(process.env.REDIS_PORT), // Redis port
      host: process.env.REDIS_HOST, // Redis host
      family: 4, // 4 (IPv4) or 6 (IPv6)
      password: process.env.REDIS_PASSWORD,
      db: 0,
    });
  } else {
    redis = new Redis(`${process.env.REDIS_URL}`);
  }
} catch (e) {
  logger.error(e);
}

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

const isValid = (config) => {
  if (
    config.parentKey &&
    config.childKey &&
    config.url &&
    (config.module ||
      (config.rules.iterSelector &&
        config.rules.question.selector &&
        (config.rules.answer.adjacentToQuestion ||
          config.rules.answer.selector)))
  ) {
    return true;
  } else {
    return false;
  }
};

const scheduleCronJobs = () => {
  logger.debug(`Refreshing CRON Jobs`);
  try {
    cronTasks = [];
    getAllConfigs().then((configs) => {
      configs.forEach((config) => {
        try {
          config = JSON.parse(config);
          if (isValid(config)) {
            if (cron.validate(config.cron)) {
              var task = cron.schedule(config.cron, () => {
                logger.debug(`CRON: Time to refresh`, config);
                refreshResults(config);
              });
              cronTasks.push(task);
            }
          }
        } catch (e) {
          logger.error(`CRON: Bad config: config`);
        }
      });
    });
  } catch (e) {
    logger.error(e);
  }
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

router.get("/ping", function (req, res, next) {
  res.send({ result: "pong" });
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

router.get("/results/csv/:parentKey/:childKey", function (req, res, next) {
  let parentKey = req.params.parentKey;
  let childKey = req.params.childKey;
  getResults(parentKey, childKey).then((result) => {
    if (result) {
      let parsedResults = JSON.parse(result, null, 2);

      let csvFileName = `${parentKey}-${childKey}-bulk-import.csv`;
      res.writeHead(200, {
        "Content-Type": "text/csv",
        "Content-Disposition": "attachment; filename=" + csvFileName,
      });
      const stream = format();
      stream.pipe(res);

      stream.write(["#ignore", "FAQ data below", "Training Examples"]);

      parsedResults.results.forEach((qa) => {
        let question = replaceall("?Show", "?", qa.question);
        stream.write(["#question_answer", question, ""]);
        stream.write(["#question", "", question]);
        stream.write(["#answer", qa.answer], "");
      });
      stream.end();
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

router.post("/qna", function (req, res, next) {
  let qnaConfig = req.body;
  let csvFileName = `csv-bulk-import-teneo.csv`;
  res.writeHead(200, {
    "Content-Type": "text/csv",
    "Content-Disposition": "attachment; filename=" + csvFileName,
  });
  const stream = format();
  stream.pipe(res);

  stream.write(["#ignore", "FAQ data below", "Training Examples"]);
  qnaConfig.qnaDocuments.forEach((qa) => {
    stream.write(["#question_answer", qa.questions[0], ""]);
    stream.write(["#question", "", qa.questions[0]]);
    stream.write(["#answer", qa.answer], "");
  });
  stream.end();
  // res.send({ result: "ok" });
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
  try {
    getAllConfigs()
      .then((results) => {
        results.forEach((result) => {
          allConfigs.push(JSON.parse(result, null, 2));
        });
        allConfigs.sort(sortConfigs);
        res.send(allConfigs);
      })
      .catch((err) => {
        res.send(allConfigs);
      });
  } catch (e) {
    res.send(allConfigs);
  }
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

  if (config.module) {
    handModuleScrape(config)
      .then((results) => {
        res.send(results);
      })
      .catch((error) => {
        emptyResults.error = error.message;
        res.send(emptyResults);
      });
  } else {
    handleScrape(config)
      .then((results) => {
        res.send(results);
      })
      .catch((error) => {
        emptyResults.errorLog = error.message;
        res.send(emptyResults);
      });
  }
});

router.post("/test-scrape-module", function (req, res, next) {
  let config = req.body;
  logger.debug("Testing Scrape Module");
  let emptyResults = {
    date: new Date().toUTCString(),
    config: config,
    results: [],
  };

  handModuleScrape(config)
    .then((results) => {
      res.send(results);
    })
    .catch((error) => {
      logger.error(`Module Scrape Error: ${error.message}`);
      emptyResults.logResults = error;
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

  if (config.module) {
    handModuleScrape(config)
      .then((results) => {
        delete results.logResults;
        saveResults(results);
        saveConfig(config);
        res.send(results);
      })
      .catch((error) => {
        emptyResults.error = error.message;
        res.send(emptyResults);
      });
  } else {
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
  }
});

const handModuleScrape = (config) => {
  //// Example ////
  let logResults = [];
  var stdout = process.stdout;

  let results = {
    date: new Date().toUTCString(),
    config: config,
    results: [],
    logResults: [],
  };

  return new Promise((resolve, reject) => {
    try {
      c.queue([
        {
          uri: config.url,
          jQuery: true,

          callback: async function (error, scrapeRes, done) {
            var q = url.parse(config.url, true);
            let site = q.protocol + "//" + q.host;
            results.results = [];
            if (error) {
              logger.debug(
                `Can't perform the initial scrape: ${error.message}`
              );
              results.logResults.push(error.stack);
              reject(logResults);
            } else {
              var jQuery = scrapeRes.$;
              let hookPromise = null;
              try {
                hookPromise = hookStd.stdout((output) => {
                  results.logResults.push(output);
                });
                let buff = Buffer.from(config.module, "base64");
                let text = buff.toString("ascii");
                let customJobModule = requireFromString(text);
                results.results = customJobModule.getAll(jQuery);
                if (results.results.length > 0) {
                  results.results.forEach((result) => {
                    cleanQuestion(result);
                    cleanAnswer(result);
                    fixRelativeUrls(result, site);
                  });
                }
                hookPromise.unhook();
                await hookPromise;
              } catch (e) {
                hookPromise.unhook();
                await hookPromise;
                logResults.push(e.message);
                reject(logResults);
                done();
              }

              resolve(results);
              done();
            }
          },
        },
      ]);
    } catch (e) {
      logResults.push(e.stack);
      reject(logResults);
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
      if (
        config.rules.answer.isHtml ||
        /<([A-Za-z][A-Za-z0-9]*)\b[^>]*>(.*?)<\/\1>/.test(qa.answer)
      ) {
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
      if (
        config.rules.question.isHtml ||
        /<([A-Za-z][A-Za-z0-9]*)\b[^>]*>(.*?)<\/\1>/.test(qa.question)
      ) {
        qa.question = pretty(
          `<span class='faq-scraper-question'>${qa.question}</span>`,
          { ocd: true }
        );
      }
    }
  }
};

function handleScrape(config, test = true) {
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
  //   },
  //   module: ""
  // }
  let results = {
    date: new Date().toUTCString(),
    config: config,
    results: [],
  };

  function isUnique(quesiton) {
    if (results.results.find((o) => o.question === quesiton)) {
      return false;
    } else {
      return true;
    }
  }

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

              try {
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
                        console.log(qa.question);

                        let aElem = jQuery(qElem).nextUntil(
                          config.rules.question.selector
                        );
                        qa.answer = config.rules.answer.isHtml
                          ? jQuery(aElem).html()
                          : jQuery(aElem).text();

                        cleanAnswer(qa);

                        if (qa.question && qa.answer && isUnique(qa.question)) {
                          fixRelativeUrls(qa, site);
                          results.results.push(qa);
                        }
                      });
                  });
                } else {
                  jQuery(config.rules.iterSelector).each(function (i, elem) {
                    let qa = {};
                    let qElem = jQuery(this).find(
                      config.rules.question.selector
                    );
                    if (qElem.length === 1) {
                      qa.question = config.rules.question.isHtml
                        ? jQuery(qElem).html()
                        : jQuery(qElem).text();

                      let aElem = jQuery(this).find(
                        config.rules.answer.selector
                      );
                      qa.answer = config.rules.answer.isHtml
                        ? jQuery(aElem).html()
                        : jQuery(aElem).text();
                      cleanQuestion(qa);
                      cleanAnswer(qa);

                      if (qa.question && qa.answer) {
                        fixRelativeUrls(qa, site);
                        results.results.push(qa);
                      }
                    } else if (qElem > 1) {
                      jQuery(qElem).each(function (qIndex, qElemActual) {
                        console.log(jQuery(qElemActual).text());
                      });
                    }
                  });
                }
              } catch (e) {
                reject(e);
                done();
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

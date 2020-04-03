const morgan = require("morgan");
const winston = require("./config/winston");

var express = require("express");
// var path = require("path");
var cookieParser = require("cookie-parser");
var logger = require("morgan");

var scaperRouter = require("./routes/scraper");

var app = express();

app.use(morgan("tiny", { stream: winston.stream }));
app.use(logger("dev"));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());

app.use("/", scaperRouter);

app.use(function(err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get("env") === "development" ? err : {};

  // include winston logging
  winston.error(
    `${err.status || 500} - ${err.message} - ${req.originalUrl} - ${
      req.method
    } - ${req.ip}`
  );

  // render the error page
  res.status(err.status || 500);
  res.render("error");
});

module.exports = app;

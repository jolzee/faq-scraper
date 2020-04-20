const morgan = require("morgan");
const winston = require("./config/winston");
var cors = require("cors");

var express = require("express");
// var path = require("path");
var cookieParser = require("cookie-parser");
var logger = require("morgan");

var scaperRouter = require("./routes/router");

var app = express();

app.use(cors());
app.use(morgan("tiny", { stream: winston.stream }));
app.use(logger("dev"));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.engine("html", require("ejs").renderFile);
app.set("view engine", "html");

app.use(function (req, res, next) {
  res.header("Access-Control-Allow-Origin", "*"); // update to match the domain you will make the request from
  res.header(
    "Access-Control-Allow-Headers",
    "Origin, X-Requested-With, Content-Type, Accept"
  );
  next();
});

app.use(function (err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get("env") === "development" ? err : {};

  // include winston logging
  winston.error(
    `${err.status || 500} - ${err.message} - ${req.originalUrl} - ${
      req.method
    } - ${req.ip}`
  );
  res.header("Access-Control-Allow-Origin", "*");
  res.header(
    "Access-Control-Allow-Headers",
    "Origin, X-Requested-With, Content-Type, Accept"
  );
  res.header("Access-Control-Allow-Methods", "GET, PUT, POST, DELETE");
  // render the error page
  res.status(err.status || 500);
  res.render("error");
});

app.use("/", scaperRouter);

module.exports = app;

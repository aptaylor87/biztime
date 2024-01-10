/** BizTime express application. */

const express = require("express");
const app = express();
const ExpressError = require("./expressError")
const slugify = require("slugify")

app.use(express.json());

const cRoutes = require("./routes/companies");
app.use("/companies", cRoutes);

const iRoutes = require("./routes/invoices");
app.use("/invoices", iRoutes);

const indRoutes = require("./routes/industries");
app.use("/industries", indRoutes);

/** 404 handler */

app.use(function(req, res, next) {
  const err = new ExpressError("Not Found", 404);
  return next(err);
});

/** general error handler */

app.use((err, req, res, next) => {
  res.status(err.status || 500);

  return res.json({
    // error: err,
    message: err.message
  });
});


module.exports = app;

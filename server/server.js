const express = require('express');
const util = require('util');
const webPush = require('web-push');
const moment = require('moment-timezone');
const logger = require('morgan');
require('dotenv').config();
const app = express();
app.use(logger((tokens, req, res) => {
    const now = new Date().getTime();
    let zone = 'Asia/Karachi';
    const string = moment.tz(now, zone).format('Do MMMM, h:mm:ss a');
    return [
      `${string} | `,
      tokens.method(req, res),
      tokens.url(req, res),
      tokens.status(req, res),
      tokens.res(req, res, 'content-length'), '-',
      tokens['response-time'](req, res), 'ms',
    ].join(' ');
  }));
app.use(function (req, res, next) {
    console.log(`HIT ${req.url} ${req.method}`);
    express.json()(req, res, next);
})
const payloads = {};
if (!process.env.VAPID_PUBLIC_KEY || !process.env.VAPID_PRIVATE_KEY) {
    console.log("You must set the VAPID_PUBLIC_KEY and VAPID_PRIVATE_KEY " +
        "environment variables. You can use the following ones:");
    console.log(webPush.generateVAPIDKeys());
    return;
}
// Set the keys used for encrypting the push messages.
webPush.setVapidDetails(
    'https://serviceworke.rs/',
    process.env.VAPID_PUBLIC_KEY,
    process.env.VAPID_PRIVATE_KEY
);
app.use(function corsify (req, res, next) {
    // http://enable-cors.org/server_expressjs.html
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Headers', 'Origin, Content-Type, Accept');
    next();
});

app.use(function forceSSL(req, res, next) {
    var host = req.get('Host');
    var localhost = 'localhost';
  
    if (host.substring(0, localhost.length) !== localhost) {
      // https://developer.mozilla.org/en-US/docs/Web/Security/HTTP_strict_transport_security
      res.header('Strict-Transport-Security', 'max-age=15768000');
      // https://github.com/rangle/force-ssl-heroku/blob/master/force-ssl-heroku.js
      if (req.headers['x-forwarded-proto'] !== 'https') {
        return res.redirect('https://' + host + req.url);
      }
    }
    return next();
  });
  
  app.use(function corsify(req, res, next) {
    // http://enable-cors.org/server_expressjs.html
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Headers', 'Origin, Content-Type, Accept');
    next();
  });

app.get('/', function (req, res) {
    return res.json({
        success: 1
    })
});
app.get('/vapidPublicKey', function (req, res) {
    res.send(process.env.VAPID_PUBLIC_KEY);
});

app.post('/register', function (req, res) {
    const {subscription} = req.body;
    res.sendStatus(201);
});

app.post('/sendNotification', function (req, res) {
    const subscription = req.body.subscription;
    const payload = req.body.payload;
    const options = {
      TTL: req.body.ttl
    };

    setTimeout(function() {
      payloads[req.body.subscription.endpoint] = payload;
      webPush.sendNotification(subscription, null, options)
      .then(function() {
        res.sendStatus(201);
      })
      .catch(function(error) {
        res.sendStatus(500);
        console.log(error);
      });
    }, req.body.delay * 1000);
});
app.get('/getPayload', function(req, res) {
    
    console.log("file: server.js | line 102 | app.get | req.query.endpoint", req.query.endpoint);
    res.send(payloads[req.query.endpoint]);
  });
var port = process.env.PORT || 3003;
var ready = new Promise(function willListen(resolve, reject) {
  app.listen(port, function didListen(err) {
    if (err) {
      reject(err);
      return;
    }
    console.log('app.listen on http://localhost:%d', port);
    resolve();
  });
});

exports.ready = ready;
exports.app = app;

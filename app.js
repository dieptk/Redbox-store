var express = require('express');
var path = require('path');
var favicon = require('serve-favicon');
var logger = require('morgan');
var cookieParser = require('cookie-parser');
var session = require('express-session');
var bodyParser = require('body-parser');
var mongoose = require('mongoose');
var passport = require('passport');
var moment = require('moment');
var LocalStrategy = require('passport-local').Strategy;
var bcrypt = require('bcryptjs');

var index = require('./routes/index');
var users = require('./routes/users');
var admin = require('./routes/admin');
var cate = require('./routes/cate');
var product = require('./routes/product');
var cart = require('./routes/cart');

var salt = bcrypt.genSaltSync(10);
var hash = bcrypt.hashSync("B4c0/\/", salt);

var expressValidator = require('express-validator');
var flash = require('connect-flash');
var app = express();

//var upload = multer({ dest: '/public/uploads/' })
// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

mongoose.connect('mongodb://localhost:27017/shopping', { useMongoClient: true });

// uncomment after placing your favicon in /public
//app.use(favicon(path.join(__dirname, 'public', 'favicon.ico')));
app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));
//app.use(session({ secret: 'chauminhthien', resave: true, saveUninitialized: true }))


app.use(expressValidator({
  errorFormatter: function(param, msg, value) {
      var namespace = param.split('.')
      , root    = namespace.shift()
      , formParam = root;

    while(namespace.length) {
      formParam += '[' + namespace.shift() + ']';
    }
    return {
      param : formParam,
      msg   : msg,
      value : value
    };
  }
}));

app.use(session({
  secret: 'chauminhthien',
  resave: true,
  key: 'user',
  saveUninitialized: true

}));

app.use(passport.initialize());
app.use(passport.session());

app.use(flash());
app.use(function(req, res, next){
	res.locals.success_msg = req.flash('success_msg');
	res.locals.error_msg = req.flash('error_msg');
	res.locals.error = req.flash('error');
  res.locals.serverChoose = req.session.server
  res.locals.isLogin = req.session.isLogin
	next();
});


const Boat = require('./model/Boat');


app.get('/create-boad', (req, res) => {
  Boat.findOne({}).exec((e, r) => {
    if (e) {
      res.status(500).send(JSON.stringify({state: false}))
    } else {
      if (r) {
        res.status(200).send(JSON.stringify({state: true, data: r}))
      } else {
        const boat = new Boat({
          name: "BOAT-DEMO",
          tracking: []
        })
        boat.save((e, r) => {
          if (e) {
            res.status(500).send(JSON.stringify({state: false}))
          } else {
            res.status(200).send(JSON.stringify({state: true, data: r}))
          }
        })
      }
    }
  })
})

const calculateDistance = (lat1, lon1, lat2, lon2) => {
    var R = 6371; // km (change this constant to get miles)
    var dLat = (lat2-lat1) * Math.PI / 180;
    var dLon = (lon2-lon1) * Math.PI / 180;
    var a = Math.sin(dLat/2) * Math.sin(dLat/2) +
        Math.cos(lat1 * Math.PI / 180 ) * Math.cos(lat2 * Math.PI / 180 ) *
        Math.sin(dLon/2) * Math.sin(dLon/2);
    var c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    var d = R * c;
    return d * 1000
}

app.post('/update-location', (req, res) => {
  Boat.findOne({}).exec((e, r) => {
    if (e) {
      res.status(500).send(JSON.stringify({state: false}))
    } else {
      if (r) {
        if (r.tracking.length) {
          const lastPoint = r.tracking[r.tracking.length - 1]
          const distance = calculateDistance(lastPoint.lat, lastPoint.lng, convertToDecimal(req.body.lat), convertToDecimal(req.body.lng))
          if (distance > 30) {
            r.tracking.push({
              lat: convertToDecimal(req.body.lat),
              lng: convertToDecimal(req.body.lng),
              speed: req.body.speed,
              fuel: req.body.fuel,
              dateCreate: new Date(),
              bearing: req.body.bearing
            })
          }
        } else {
          r.tracking.push({
            lat: convertToDecimal(req.body.lat),
            lng: convertToDecimal(req.body.lng),
            speed: req.body.speed,
            fuel: req.body.fuel,
            dateCreate: new Date(),
            bearing: req.body.bearing
          })
        }
        r.save(e => {
          if (e) {
            res.status(500).send(JSON.stringify({state: false}))
          } else {
            res.status(200).send(JSON.stringify({state: true}))
          }
        })
        io.in(`BOAT DEMO`).emit('NEW LOCATION', {
          lat: convertToDecimal(req.body.lat),
          lng: convertToDecimal(req.body.lng),
          speed: req.body.speed,
          fuel: req.body.fuel,
          dateCreate: new Date(),
          bearing: req.body.bearing
        });
      } else {
        res.status(200).send(JSON.stringify({state: false, msg: "Boat does not exist"}))
      }
    }
  })
})

app.post('/update-location-offline', (req, res) => {
  Boat.findOne({}).exec((e, r) => {
    if (e) {
      res.status(500).send(JSON.stringify({state: false}))
    } else {
      if (r) {
      	req.body.position.map(e => {
      		r.tracking.push({
            lat: convertToDecimal(e.lat),
            lng: convertToDecimal(e.lng),
            speed: e.speed,
            fuel: e.fuel,
            dateCreate: convertDateTime(e.date),
            bearing: e.bearing
          })
      	})
        r.save(e => {
          if (e) {
            res.status(500).send(JSON.stringify({state: false}))
          } else {
            res.status(200).send(JSON.stringify({state: true}))
          }
        })
      } else {
        res.status(200).send(JSON.stringify({state: false, msg: "Boat does not exist"}))
      }
    }
  })
})

app.get('/get-location', (req, res) => {
  Boat.findOne({}).lean().exec((e, r) => {
    if (e) {
      res.status(500).send(JSON.stringify({state: false}))
    } else {
      if (r) {
        let results = []
        r.tracking.forEach(e => {
          e.dateCreate = (new Date(e.dateCreate)).getTime()
        })
        if (req.query.time_start) {
          r.tracking.map(e => {
            if (req.query.time_start <= e.dateCreate) {
              results.push(e)
            }
          })
          r.tracking = results
        }
        if (req.query.time_end) {
          r.tracking = []
          results.map(e => {
            if (req.query.time_end >= e.dateCreate) {
              r.tracking.push(e)
            }
          })
        }
        res.status(200).send(JSON.stringify({state: true, data: r}))
      } else {
        res.status(200).send(JSON.stringify({state: false, msg: "Boat does not exist"}))
      }
    }
  })
})

app.get('/clear-location', (req, res) => {
  Boat.updateOne({}, {
    tracking: []
  }).exec((e) => {
    if (e) {
      res.status(500).send(JSON.stringify({state: false}))
    } else {
      res.status(500).send(JSON.stringify({state: true}))
    }
  })
})

app.use('/', index);
app.use('/users', users);
app.use('/admin', admin);
app.use('/admin/cate', cate);
app.use('/admin/product', product);
app.use('/admin/cart', cart);

// catch 404 and forward to error handler
app.use(function(req, res, next) {
  var err = new Error('Not Found');
  err.status = 404;
  next(err);
});

// error handler
app.use(function(err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render('error');
});

function convertToDecimal(nmea) {
    var decimal;
    var dd;
    var mm;
    dd = Math.floor(nmea/100);
    mm = nmea - (dd*100);
    decimal = dd + (mm/60);
    return decimal;
}

function convertDateTime(time) {
    var string = String(time);
    var date = new Date(string.substring(0, 4) + '-' + string.substring(4, 6) + '-' + string.substring(6, 8) + 'T' + string.substring(8, 10) + ':' + string.substring(10, 12)
        + ':' + string.substring(12, 14) + 'Z');
    console.log(date.toISOString());
    return date;
}

module.exports = app;

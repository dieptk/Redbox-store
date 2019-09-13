var express = require('express');
var router = express.Router();

var Cate = require('../model/Cate.js');

var User = require('../model/User.js');

var bcrypt = require('bcryptjs');
var passport = require('passport');
var LocalStrategy = require('passport-local').Strategy;


function bodauTiengViet(str) {
    str = str.toLowerCase();
    str = str.replace(/à|á|ạ|ả|ã|â|ầ|ấ|ậ|ẩ|ẫ|ă|ằ|ắ|ặ|ẳ|ẵ/g, "a");
    str = str.replace(/è|é|ẹ|ẻ|ẽ|ê|ề|ế|ệ|ể|ễ/g, "e");
    str = str.replace(/ì|í|ị|ỉ|ĩ/g, "i");
    str = str.replace(/ò|ó|ọ|ỏ|õ|ô|ồ|ố|ộ|ổ|ỗ|ơ|ờ|ớ|ợ|ở|ỡ/g, "o");
    str = str.replace(/ù|ú|ụ|ủ|ũ|ư|ừ|ứ|ự|ử|ữ/g, "u");
    str = str.replace(/ỳ|ý|ỵ|ỷ|ỹ/g, "y");
    str = str.replace(/đ/g, "d");
    str = str.replace(/ /g, "-");
    str = str.replace(/\./g, "-");
    return str;
}

/* GET home page. */
router.get('/', checkAdmin, function(req, res, next) {
  res.render('admin/main/index');
});

router.get('/dang-nhap.html', function(req, res, next) {
  res.render('admin/login/index');
});

router.get('/dang-ky.html', function(req, res, next) {
  res.render('admin/login/sign_up');
});

router.post('/dang-ky.html', function(req, res, next) {
  let u = new User({
    fullname    : "Khac diep",
    img      : "avatar_default.png",
    email      : req.body.email,
    password     : req.body.password,
  })
  u.save((e) => {
    res.redirect('/admin/dang-nhap.html')
  })
});




router.post('/dang-nhap.html',
  passport.authenticate('local', { successRedirect: '/admin',
                                   failureRedirect: '/admin/dang-nhap.html',
                                   failureFlash: true })
);

passport.use(new LocalStrategy({
    usernameField: 'email',
    passwordField: 'password'
  },

  function(username, password, done) {
      User.findOne({email: username}, function(err, username){
          if(err) throw err;
          if(username){
            if (password == username.password) {
              return done(null, username);
            } else {
              return done(null, false, { message: "Password not correct" });
            }
          } else{
             return done(null, false, { message: 'Account not exist' });
          }
      });
  }

));

passport.serializeUser(function(email, done) {

  done(null, email.id);
});

passport.deserializeUser(function(id, done) {
  User.findById(id, function(err, email) {
    done(err, email);
  });
});



router.post('/getUser',checkAdmin, function (req, res) {
    res.json(req.user);
});

router.get('/dang-xuat.html',checkAdmin, function (req, res) {
    req.logout();
    res.redirect('/admin/dang-nhap.html');
});

const key = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJvcmdhbml6YXRpb25faWQiOiI1ZDI4NTRkZDY1ODg5NDIyZGU0MGYyZjciLCJrZXkiOiIyMDE5LTA3LTEyVDA5OjQwOjA4LjE0MVoiLCJpYXQiOjE1NjI5MjQ0MDh9.ciK9qQx7l2cBK1V9-sYVpTLZWodjdltNQ57OOH7sueI'

// const key = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJvcmdhbml6YXRpb25faWQiOiI1ZDQ3ODg4ZjQyY2ViNTA5MzhhNGQzYWYiLCJrZXkiOiIyMDE5LTA4LTEyVDEwOjAzOjAzLjc4NloiLCJpYXQiOjE1NjU2MDQxODN9.7FDG5Zj4DpkeAkeziG9orPO9nan3_nBnAG66auW7JNM'

// const host = 'http://localhost:8080'
const host = 'https://stage.redboxsa.com'

router.get('/shipments/:id', checkAdmin, function (req, res) {
  var request = require('request');
  request.get({
    headers: {'content-type' : 'application/x-www-form-urlencoded', "Authorization": `Bearer ${key}`},
    url: `${host}/api/business/v1/shipment-detail?shipment_id=${req.params.id}`,
  }, function(error, response, body){
    if (body) {
      body = JSON.parse(body)
      console.log(body);
      if (body.success) {
        res.render('admin/shipment/detail', {data: body.data});
      } else {
        req.flash('success_msg', "Shipment not exist");
      }
    } else {
      req.flash('success_msg', "Shipment not exist");
    }
  });
})

router.get('/shipments/edit/:id', checkAdmin, function (req, res) {
  var request = require('request');
  request.get({
    headers: {'content-type' : 'application/x-www-form-urlencoded', "Authorization": `Bearer ${key}`},
    url: `${host}/api/business/v1/shipment-detail?shipment_id=${req.params.id}`,
  }, function(error, response, body){
    if (body) {
      body = JSON.parse(body)
      if (body.success) {
        req.flash('success_msg', "Update success");
        res.render('admin/shipment/edit', {data: body.data});
      } else {
        req.flash('success_msg', "Shipment not exist");
      }
    } else {
      req.flash('success_msg', "Shipment not exist");
    }
  });
})

router.post('/shipments/edit/:id', checkAdmin, function (req, res) {
  var request = require('request');
  request({
    headers: {'content-type' : 'application/x-www-form-urlencoded', "Authorization": `Bearer ${key}`},
    url: `${host}/api/business/v1/update-shipment`,
    method: "PUT",
    body: `reference=${req.body.reference}&shipment_id=${req.params.id}&items=${req.body.items}&size=${req.body.size}&point_id=${req.body.point}&locker_id=${req.body.locker}&cod_currency=${req.body.cod_currency}&cod_amount=${req.body.cod_amount}&sender_name=${req.body.sender_name}&sender_email=${req.body.sender_email}&sender_phone=${req.body.sender_phone}&sender_address=${req.body.sender_address}&receiver_name=${req.body.receiver_name}&receiver_email=${req.body.receiver_email}&receiver_phone=${req.body.receiver_phone}&receiver_address=${req.body.receiver_address}`
  }, function(error, response, body){
    if (body) {
      if (body.success) {
        req.flash('success_msg', "Update success");
        res.redirect('/admin/shipments/' + req.params.id)
      } else {
        req.flash('success_msg', body.msg);
        res.redirect('/admin/shipments/' + req.params.id)
      }
    } else {
      req.flash('success_msg', "Error");
      res.redirect('/admin/shipments/' + req.params.id)
    }
  });
})

router.get('/shipments/cancel/:id', checkAdmin, function (req, res) {
  var request = require('request');
  request({
    headers: {'content-type' : 'application/x-www-form-urlencoded', "Authorization": `Bearer ${key}`},
    url: `${host}/api/business/v1/cancel-shipment`,
    method: "PUT",
    body: `shipment_id=${req.params.id}`
  }, function(error, response, body){
    if (body) {
      if (body.success) {
        req.flash('success_msg', "Update success");
        res.redirect('/admin/shipments/' + req.params.id)
      } else {
        req.flash('success_msg', body.msg);
        res.redirect('/admin/shipments/' + req.params.id)
      }
    } else {
      req.flash('success_msg', "Error");
      res.redirect('/admin/shipments/' + req.params.id)
    }
  });
})

router.get('/shipments', checkAdmin, function (req, res) {
  var request = require('request');
  request({
    headers: {'content-type' : 'application/x-www-form-urlencoded', "Authorization": `Bearer ${key}`},
    url: `${host}/api/business/v1/get-shipments`,
    method: "GET",
  }, function(error, response, body){
    if (body) {
      body = JSON.parse(body)
      if (body.success) {
        res.render('admin/shipment/list', {data: body.data});
      } else {
        req.flash('success_msg', body.msg);
        res.redirect('/admin/')
      }
    } else {
      console.log(1);
      req.flash('success_msg', "Error");
    }
  });
})

router.get('/shipments/create-return/:id', checkAdmin, function (req, res) {
  var request = require('request');
  request.get({
    headers: {'content-type' : 'application/x-www-form-urlencoded', "Authorization": `Bearer ${key}`},
    url: `${host}/api/business/v1/shipment-detail?shipment_id=${req.params.id}`,
  }, function(error, response, body){
    if (body) {
      body = JSON.parse(body)
      if (body.success) {
        request({
          headers: {'content-type' : 'application/x-www-form-urlencoded', "Authorization": `Bearer ${key}`},
          url: `${host}/api/business/v1/return-shipment`,
          method: "POST",
          body: `reference=${req.body.reference}&shipment_id=${req.params.id}&items=${body.data.items}&size=${body.data.size}&point_id=${body.data.point.id}&locker_id=${body.data.locker.id}&cod_currency=${body.data.cod.currency}&cod_amount=${body.data.cod.amount}&sender_name=${body.data.receiver.name}&sender_email=${body.data.receiver.email}&sender_phone=${body.data.receiver.phone}&sender_address=${body.data.receiver.address}&receiver_name=${body.data.sender.name}&receiver_email=${body.data.sender.email}&receiver_phone=${body.data.sender.phone}&receiver_address=${body.data.sender.address}`
        }, function(error, response, body){
          if (body) {
            body = JSON.parse(body)
            if (body.success) {
              req.flash('success_msg', "Created successfully");
              res.redirect('/admin/shipments')
            } else {
              req.flash('success_msg', body.msg);
              res.redirect('/admin/shipments')
            }
          } else {
            req.flash('success_msg', "Error");
            res.redirect('/admin/shipments')
          }
        });
      } else {
        req.flash('success_msg', "Shipment not exist");
        res.redirect('/admin/shipments')
      }
    } else {
      req.flash('success_msg', "Shipment not exist");
      res.redirect('/admin/shipments')
    }
  });
})

function checkAdmin(req, res, next){

    if(req.isAuthenticated()){
      next();
    }else{
      res.redirect('/admin/dang-nhap.html');
    }
}

module.exports = router;

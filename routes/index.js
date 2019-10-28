var express = require('express');
var router = express.Router();

var Cate = require('../model/Cate.js');
var Product = require('../model/Product.js');
var GioHang = require('../model/giohang.js');
var Cart = require('../model/Cart.js');

const axios = require('axios');

var countJson = function(json) {
	var count = 0;
	for (var id in json) {
		count++;
	}

	return count;
}

/* GET home page. */
router.get('/', function(req, res) {
	var giohang = new GioHang((req.session.cart) ? req.session.cart : {
		items: {}
	});
	var data = giohang.convertArray();
	Product.find().then(function(product) {
		Cate.find().then(function(cate) {
			res.render('site/page/index', {
				product: product,
				cate: cate,
				numberItems: data.length
			});
		});
	});

});

router.get('/cate/:name.:id.html', function(req, res) {

	Product.find({
		cateId: req.params.id
	}, function(err, data) {
		Cate.find().then(function(cate) {
			res.render('site/page/cate', {
				product: data,
				cate: cate
			});
		});
	});
});

router.get('/chi-tiet/:name.:id.:cate.html', function(req, res) {
	Product.findById(req.params.id).then(function(data) {
		Product.find({
			cateId: data.cateId,
			_id: {
				$ne: data._id
			}
		}).limit(4).then(function(pro) {
			res.render('site/page/chitiet', {
				data: data,
				product: pro
			});
		});
	});

});

// const key = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJvcmdhbml6YXRpb25faWQiOiI1ZDQ3ODg4ZjQyY2ViNTA5MzhhNGQzYWYiLCJrZXkiOiIyMDE5LTA4LTEyVDEwOjAzOjAzLjc4NloiLCJpYXQiOjE1NjU2MDQxODN9.7FDG5Zj4DpkeAkeziG9orPO9nan3_nBnAG66auW7JNM'
// const host = 'http://localhost:8080'

const key = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJvcmdhbml6YXRpb25faWQiOiI1ZDI4NTRkZDY1ODg5NDIyZGU0MGYyZjciLCJrZXkiOiIyMDE5LTA3LTEyVDA5OjQwOjA4LjE0MVoiLCJpYXQiOjE1NjI5MjQ0MDh9.ciK9qQx7l2cBK1V9-sYVpTLZWodjdltNQ57OOH7sueI'
const host = 'https://stage.redboxsa.com'


router.post('/dat-hang.html', function(req, res) {
	var giohang = new GioHang((req.session.cart) ? req.session.cart : {
		items: {}
	});
	var data = giohang.convertArray();
	var items = [];
	data.map(e => {
		e.item.quantity = e.soluong
		items.push(e.item)
	})
	var amount = 0
	data.map(e => {
		amount += e.tien
	})
	if (req.body.type_delivery == '1') {
		axios.post(`${host}/api/business/v1/create-shipment`, {
				reference: new Date().getTime(),
				items: items,
				size: "Small",
				point_id: req.body.point,
				locker_id: req.body.locker,
				sender_name: "Redbox store",
				sender_email: "redboxsa@gmail.com",
				sender_phone: "0986845623",
				sender_address: "Riyadh",
				receiver_name: req.body.receiver_name,
				receiver_email: req.body.receiver_email,
				receiver_phone: req.body.receiver_phone,
				receiver_address: req.body.receiver_address,
				cod_currency: "SAR",
				cod_amount: amount
			}, {
				headers: {
					'content-type': 'application/json',
					"Authorization": `Bearer ${key}`
				}
			})
			.then(function(response) {
				var data = response.data;
				if (data) {
					if (data.success) {
						var cart = new Cart({
							name: req.body.name,
							email: req.body.email,
							sdt: req.body.phone,
							msg: req.body.message,
							cart: data,
							st: 0
						});

						cart.save().then(function() {
							req.flash('success_msg', "Create success");
							req.session.cart = {
								items: {}
							};
							res.redirect('/gio-hang.html');
						});
					} else {
						req.flash('success_msg', data.msg);
						res.redirect('/gio-hang.html');
					}
				} else {
					req.flash('success_msg', "Error");
					res.redirect('/gio-hang.html');
				}
			})
			.catch(function(error) {
				req.flash('success_msg', "Error");
				res.redirect('/gio-hang.html');
			});
	} else {
		var cart = new Cart({
			name: req.body.name,
			email: req.body.email,
			sdt: req.body.phone,
			msg: req.body.message,
			cart: data,
			st: 0
		});

		cart.save().then(function() {
			req.session.cart = {
				items: {}
			};
			req.flash('success_msg', "Create success");
			res.redirect('/gio-hang.html');
		});
	}

});



router.get('/dat-hang.html', function(req, res) {
	var giohang = new GioHang((req.session.cart) ? req.session.cart : {
		items: {}
	});
	const data = giohang.convertArray();

	if (req.session.cart) {
		if (countJson(req.session.cart.items) > 0) {
			let total = 0
			data.map(e => {
				total += e.tien
			})
			res.render('site/page/check', {
				errors: null,
				items: data,
				total: total,
				numberItems: data.length
			});
		} else res.redirect('/');

	} else {
		res.redirect('/');
	}
});




router.post('/menu', function(req, res) {
	Cate.find().then(function(data) {
		res.json(data);
	});
});

router.get('/add-cart.:id', function(req, res) {
	var id = req.params.id;

	var giohang = new GioHang((req.session.cart) ? req.session.cart : {
		items: {}
	});

	Product.findById(id).then(function(data) {
		giohang.add(id, data);
		req.session.cart = giohang;
		res.end('1')
	});


});

router.get('/gio-hang.html', function(req, res) {
	var giohang = new GioHang((req.session.cart) ? req.session.cart : {
		items: {}
	});
	var data = giohang.convertArray();

	res.render('site/page/cart', {
		data: data,
		numberItems: data.length
	});
});

router.post('/updateCart', function(req, res) {
	var id = req.body.id;;
	var soluong = req.body.soluong;
	var giohang = new GioHang((req.session.cart) ? req.session.cart : {
		items: {}
	});

	giohang.updateCart(id, soluong);
	req.session.cart = giohang;
	res.json({
		st: 1
	});

});

router.post('/delCart', function(req, res) {
	var id = req.body.id;
	var giohang = new GioHang((req.session.cart) ? req.session.cart : {
		items: {}
	});

	giohang.delCart(id);
	req.session.cart = giohang;
	res.json({
		st: 1
	});

});

router.post('/get-nearest-points', function(req, res) {
	var request = require('request');
	request.get({
		headers: {
			'content-type': 'application/x-www-form-urlencoded',
			"Authorization": `Bearer ${key}`
		},
		url: `${host}/api/business/v1/get-points?lat=${req.body.lat}&lng=${req.body.lng}&distance=10000000`,
	}, function(error, response, body) {
		if (body) {
			body = JSON.parse(body)
			if (body.success) {
				let points = []
				body.points.map(e => {
					points.push({
						id: e.id,
						location: e.location,
						lockers: e.lockers,
						location_name: e.location_name,
						host_name: e.host_name_en,
						location_type: e.location_type,
						address: e.address,
						icon: e.icon,
						open_hour: e.open_hour
					})
				})
				res.json({
					state: true,
					data: points
				})
			} else {
				res.json({
					state: false
				})
			}
		} else {
			res.json({
				state: false
			})
		}
	});
})

router.get('/test', function(req, res) {
	res.send('a');
});


module.exports = router;
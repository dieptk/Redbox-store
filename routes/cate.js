var express = require('express');
var router = express.Router();

var Cate = require('../model/Cate.js');

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
  res.redirect('/admin/cate/danh-sach.html'); 
});

router.get('/danh-sach.html', checkAdmin,  function(req, res, next) {
	 Cate.find().then(function(data){
		res.render('admin/cate/danhsach', {data: data});
	});
  	
});

router.get('/them-cate.html', checkAdmin, function(req, res, next) {
  res.render('admin/cate/them', { errors: null});
});


router.post('/them-cate.html', checkAdmin,  function(req, res, next) {
  //res.render('admin/cate/them');
  req.checkBody('name', 'Name is required').notEmpty();
  req.checkBody('name', 'The length of name must in 5 to 32').isLength({min:5, max:32});
  var errors = req.validationErrors();
	if (errors) {
	  res.render('admin/cate/them',{errors : errors}); 
	}

	var cate = new Cate({
		name 			: req.body.name,
		nameKhongDau 	: bodauTiengViet(req.body.name)
	});

	cate.save().then(function(){
		req.flash('success_msg', 'Created successfully');
		res.redirect('/admin/cate/them-cate.html'); 
	});

  
});


router.get('/:id/sua-cate.html', checkAdmin,  function(req, res, next) {
	Cate.findById(req.params.id, function(err, data){
		res.render('admin/cate/sua',{ errors: null, data: data});
	});	
});

router.post('/:id/sua-cate.html', checkAdmin,  function(req, res, next) {
	req.checkBody('name', 'Name is required').notEmpty();
    req.checkBody('name', 'The length of name must in 5 to 32').isLength({min:5, max:32});
  	var errors = req.validationErrors();
  	if(errors){
  		Cate.findById(req.params.id, function(err, data){
			res.render('admin/cate/sua',{ errors: errors, data: data});
		});	
  	}else{
  		Cate.findById(req.params.id, function(err, data){
			data.name 			= req.body.name;
			data.nameKhongDau 	= bodauTiengViet(req.body.name);
			data.save();
			req.flash('success_msg', 'Updated successfully');
			res.redirect('/admin/cate/'+req.params.id+'/sua-cate.html');
		});
  	}

});

router.get('/:id/xoa-cate.html',  checkAdmin,  function(req, res, next) {
	
	Cate.findById(req.params.id).remove(function() { 
		req.flash('success_msg', 'Delete successfully');
		res.redirect('/admin/cate/danh-sach.html');
	});
});

function checkAdmin(req, res, next){
   
    if(req.isAuthenticated()){
      next();
    }else{
      res.redirect('/admin/dang-nhap.html');
    }
}
module.exports = router;
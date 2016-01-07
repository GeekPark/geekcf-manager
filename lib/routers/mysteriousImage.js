var router = require('express').Router(),
    multipart = require('connect-multiparty'),
    base = require('../base'),
    Q = require('q');

router.route('/')
    .get(function(req, res, next) {
        base.MysteriousImage.find()
            .then(function(list) {
                res.render('mysterious-list', {
                    list: list
                });
            });
    });

router.route('/add')
    .get(function(req, res, next) {
        res.render('mysterious-add');

    })
    .post(multipart(), function(req, res, next) {
        var mobileImage = base.file.mkfile(req.files.mobileImage);
        var image = base.file.mkfile(req.files.image);
        Q.all([mobileImage, image])
            .then(function(result) {
                var mysterious = {};
                mysterious.mobileImage = result[0];
                mysterious.image = result[1];
                mysterious.title = req.body.title;
                mysterious.isShow = req.body.isShow;
                return base.MysteriousImage.create(mysterious);
            })
            .then(function(mysterious) {
                res.redirect('/mysterious');
            });
    });

router.route('/:id/edit')
    .get(function(req,res,next){
        base.MysteriousImage.findOne({'_id':req.params.id})
            .then(function(mysterious){
                res.render('mysterious-edit',{
                    model:mysterious
                });
            });
    })
    .post(multipart(),function(req,res,next){
        base.MysteriousImage.findOne({'_id':req.params.id})
            .then(function(mysterious){
                    mysterious.title = req.body.title;
                    mysterious.isShow = req.body.isShow;
                    var model = mysterious.save();
                    var promises = [];
                    var mobileImage,image;
                    if(req.files.mobileImage.originalFilename) {
                        mobileImage = base.file.mkfile(req.files.mobileImage);
                    }
                    if (req.files.image.originalFilename){
                        image = base.file.mkfile(req.files.image);
                    }
                    return Q.all([mobileImage,image,model]); 
            })
            .then(function(result){
                var mysterious = result[2];
                if(result[0]){
                    mysterious.mobileImage = result[0];
                } 
                if(result[1]) {
                    mysterious.image = result[1];
                }
                mysterious.save();
                res.redirect('/mysterious');
            });
    })

module.exports = router;
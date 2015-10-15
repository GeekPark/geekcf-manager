var router = require('express').Router(),
    base = require('../base');

router.route('/')
    .get(function(req,res,next){
        base.StaticText.find({},{'title':-1})
            .then(function(result){
                res.render('text', {
                    'texts':result
                });
            });
    });

router.route('/new')
    .get(function(req,res,next){
        res.render('text-new',{});
    })
    .post(function(req,res,next){
        req.body.owner = global.uid;
        base.StaticText.create(req.body)
            .then(function(text){
                res.redirect('/text');
            });
    });
   
router.route('/:id/info')
    .get(function(req,res,next){
        base.StaticText.findOne({'_id':req.params.id})
            .then(function(text){
                res.render('text-info', {
                    'text':text
                });
            });
    })
    .post(function(req,res,next){
        var text = req.body;
        text.owner = global.uid;
        base.StaticText.update({'_id':req.params.id},text,{'upsert': true})
            .then(function(t){
                res.redirect(req.originalUrl);
            });
    });
module.exports = router;
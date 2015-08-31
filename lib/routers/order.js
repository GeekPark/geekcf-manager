var router = require('express').Router(),
    util = require('../utils'),
    base = require('../base');

router.route('/:id/delete').get(function(req, res, next) {
    base.Order.findOne({ _id: req.params.id })
        .then(function(order){
            var url = '/project'+'/'+order.project+"/orders";
            order.remove();
            res.redirect(url);
        });
});

router.route('/:id/state')
    .put(function(req,res,next){
        base.Order.findOne({ _id: req.params.id })
            .then(function(order){
                order.state = req.body.state;
                order.save();
                res.end();
            });    
    });

module.exports = router;

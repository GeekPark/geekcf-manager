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

module.exports = router;

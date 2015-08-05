var router = require('express').Router(),
    util = require('../utils'),
    base = require('../base');

router.route('/')
.get(function(req, res, next) {
    base.User.list(function(err, result) {
        res.render('user', {users: result});
    });
});

router.route('/:id/:act')
.get(function(req, res, next) {
    base.User.findOneAndUpdate({
        _id: req.params.id
    }, {
        isInvestor: req.params.act === 'yes'
    }, {
        new: true
    }, function(err, result) {
        res.json({_id: result._id, isInvestor: result.isInvestor});
    });
});

module.exports = router;

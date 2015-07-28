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
    base.User.update({
        _id: req.params.id
    }, {
        isInvestor: req.params.act === 'yes'
    }, function(err, result) {
        res.redirect('/user');
    });
});

module.exports = router;

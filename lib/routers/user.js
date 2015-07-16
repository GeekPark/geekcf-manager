var router = require('express').Router(),
    util = require('../utils'),
    base = require('../base');

router.route('/')
.get(function(req, res, next) {
    base.User.list(function(err, result) {
        res.render('user', {users: result});
    });
});

module.exports = router;

var router = require('express').Router(),
    base   = require('../base');

// login
router.route('/')
.get(function(req, res, next) {
    res.render('home');
});

module.exports = router;

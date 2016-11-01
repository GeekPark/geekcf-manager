var router = require('express').Router(),
    util = require('../utils'),
    base = require('../base');

router.route('/')
.get(function(req, res, next) {
    base.Adviser
        .find()
        .then(list => {
            res.send(list);
        });
});

router.route('/create')
.post(function(req, res, next) {
    res.send(0);
});

router.route('/:id')
.get(function(req, res, next) {
    res.send(0);
});

module.exports = router;

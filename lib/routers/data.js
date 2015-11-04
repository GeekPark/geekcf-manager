var router = require('express').Router(),
    base = require('../base');

router.route('/')
.get(function(req, res, next) {
    base.Log.aggregate([{
        $group: {
            _id: '$user',
            count: {$sum: 1}
        }
    }, {
        $sort: {count: -1}
    }]).exec(function(err, logs) {
        console.log(err, logs.length);
    });
    res.render('data');
});

module.exports = router;

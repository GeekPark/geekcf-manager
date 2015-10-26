var router = require('express').Router(),
    base = require('../base');

router.route('/')
    .get(function(req, res, next) {
        var current = req.query.current || 1;
        var pageSize = req.query.size || 10;
        var pageCount = 0;
        base.ApplyingData.find({}).count()
            .then(function(count) {
                pageCount = Math.ceil(count / pageSize);
                if (current > pageCount) {
                    current = pageCount;
                }
                var start = (current - 1) * pageSize;
                return base.ApplyingData.find({}).skip(start).limit(pageSize);
            })
            .then(function(data){
                var hasPre = false;
                var hasNext = false;
                if (current < pageCount) {
                    hasNext = true;
                }
                if (current > 1 && current <= pageCount) {
                    hasPre = true;
                }
                res.render('apply', {
                    list: data,
                    count: pageCount,
                    current: current,
                    pageSize: pageSize,
                    hasPre:hasPre,
                    hasNext:hasNext
                });
            })
            .then(undefined,function(err){
                console.error(err);
                throw err;
            });


    });
module.exports = router;
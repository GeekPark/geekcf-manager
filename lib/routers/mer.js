var router = require('express')
    .Router(),
    base = require('../base');

router.route('/')
    .get(function (req, res, next) {
        var current = req.query.current || 1;
        var pageSize = req.query.size || 20;
        var pageCount = 0;
        var q = req.query.q || '';
        var find = {};
        if (q) {
            var regex = new RegExp(q, 'i');
            find.merCustName = regex;
        }
        base.MerUser.find(find)
            .count()
            .then(function (count) {
                if (count <= 0) {
                    count = 1;
                }
                pageCount = Math.ceil(count / pageSize);
                if (current > pageCount) {
                    current = pageCount;
                }
                var start = (current - 1) * pageSize;
                return base.MerUser.find(find)
                    .sort({
                        added: -1
                    })
                    .skip(start)
                    .limit(pageSize);

            })
            .then(function (data) {
                var hasPre = false;
                var hasNext = false;
                if (current < pageCount) {
                    hasNext = true;
                }
                if (current > 1 && current <= pageCount) {
                    hasPre = true;
                }
                res.render('mer-user', {
                    list: data,
                    count: pageCount,
                    current: current,
                    pageSize: pageSize,
                    hasPre: hasPre,
                    hasNext: hasNext,
                    q: q
                });
            })
            .then(undefined, function (err) {
                console.error('eee');
                throw err;
            });
    });

router.route('/projects')
    .get(function (req, res, next) {
        base.Project.find({
                merProjectId: {
                    $exists: true
                }
            }, {
                title: 1,
                merProjectId: 1
            })
            .then(function (projects) {
                res.render('mer-project', {
                    list: projects
                });
            });
    });

router.route('/project/:id')
    .get(function (req, res, next) {
        res.setHeader('Content-Type', 'application/json');
        var params = base.config.mer.service.projectSeach.slice();
        params.push('project_id=' + req.params.id);
        base.mer.makeUrl(params, 0)
            .then(function (url) {
                console.log(url);
                return base.mer.get(url);
            })
            .then(function (query) {
                res.end(JSON.stringify(query));
            })
            .then(undefined, function (err) {
                console.error(err.stack);
                res.status(500)
                    .end(JSON.stringify({
                        err: err.toString()
                    }));
            });
    });


router.route('/transfer')
    .post(function (req, res, next) {
        res.setHeader('Content-Type', 'application/json');
        var params = base.config.mer.service.projectTransfer.slice();
        params.push('project_id=' + req.body.merProjectId);
        params.push('amount=' + req.body.amount * 100);
        params.push('mer_date=' + base.mer.getMerDate());
        params.push('order_id=' + base.mer.createOrderID());
        base.mer.makeUrl(params, 0)
            .then(function (url) {
                console.log(url);
                return base.mer.get(url);
            })
            .then(function (query) {
                res.end(JSON.stringify(query));
            })
            .then(undefined, function (err) {
                console.error(err.stack);
                res.status(500)
                    .end(JSON.stringify({
                        err: err.toString()
                    }));
            });
    });

router.route('/merquery')
    .get(function (req, res, next) {
        res.setHeader('Content-Type', 'application/json');
        var params = base.config.mer.service.merQuery.slice();
        base.mer.makeUrl(params, 0)
            .then(function (url) {
                console.log(url);
                return base.mer.get(url);
            })
            .then(function (query) {
                res.end(JSON.stringify(query));
            })
            .then(undefined, function (err) {
                console.error(err.stack);
                res.status(500)
                    .end(JSON.stringify({
                        err: err.toString()
                    }));
            });
    });

router.route('/withdraw')
    .post(function (req, res, next) {
        res.setHeader('Content-Type', 'application/json');
        var params = base.config.mer.service.transferDirectReq.slice();
        params.push('amount=' + req.body.amount * 100);
        params.push('purpose=' + req.body.purpose);
        params.push('mer_date=' + base.mer.getMerDate());
        params.push('order_id=' + base.mer.createOrderID());
        base.mer.makeUrl(params, 1)
            .then(function (url) {
                console.log(url);
                return base.mer.get(url);
            })
            .then(function (query) {
                res.end(JSON.stringify(query));
            })
            .then(undefined, function (err) {
                console.error(err.stack);
                res.status(500)
                    .end(JSON.stringify({
                        err: err.toString()
                    }));
            });
    });


module.exports = router;

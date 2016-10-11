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
        var orderId = base.mer.createOrderID();
        var merDate = base.mer.getMerDate();
        params.push('project_id=' + req.body.merProjectId);
        params.push('amount=' + req.body.amount * 100);
        params.push('mer_date=' + merDate);
        params.push('order_id=' + orderId);
        var bill = {};
        bill.amount = req.body.amount;
        bill.orderId = orderId;
        bill.merDate = merDate;
        bill.added = new Date();
        bill.updated = new Date();
        bill.merProjectId = req.body.merProjectId;
        bill.type = 1;
        base.MerDirectBill.create(bill)
            .then(function (model) {
                bill = model;
                return base.mer.makeUrl(params, 0);
            })
            .then(function (url) {
                return base.mer.get(url);
            })
            .then(function (query) {
                bill.isSucceed = true;
                bill.updated = new Date();
                bill.save();
                res.end(JSON.stringify(query));
            })
            .then(undefined, function (err) {
                console.error(err.stack);
                bill.errMessage = err.toString();
                bill.save();
                res.status(500)
                    .end(JSON.stringify({
                        err: err.toString()
                    }));
            });
    });


router.route('/transferP2P')
    .post(function (req, res, next) {
        res.setHeader('Content-Type', 'application/json');
        var params = base.config.mer.service.transferP2P.slice();
        var orderId = base.mer.createOrderID();
        var merDate = base.mer.getMerDate();
        // params.push('project_id=' + req.body.merProjectId);
        params.push('amount=' + req.body.amount * 100);
        params.push('mer_date=' + merDate);
        params.push('order_id=' + orderId);
        // var bill = {};
        // bill.amount = req.body.amount;
        // bill.orderId = orderId;
        // bill.merDate = merDate;
        // bill.added = new Date();
        // bill.updated = new Date();
        // bill.merProjectId = req.body.merProjectId;
        // bill.type = 1;
        base.mer.makeUrl(params, 0)
            .then(function (url) {
                return base.mer.get(url);
            })
            .then(function (query) {
                // bill.isSucceed = true;
                // bill.updated = new Date();
                // bill.save();
                res.end(JSON.stringify(query));
            })
            .then(undefined, function (err) {
                console.error(err.stack);
                bill.errMessage = err.toString();
                bill.save();
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
        var params = base.config.mer.service.merWithdrawals.slice();
        var orderId = base.mer.createOrderID();
        var merDate = base.mer.getMerDate();
        params.push('amount=' + req.body.amount * 100);
        // params.push('purpose=' + req.body.purpose);
        // params.push('mobile_no=' + req.body.mobile);
        // params.push('bank_brhname=' + req.body.recvBankBrhname);
        // params.push('recv_account=' + req.body.recvAccount);
        // params.push('recv_user_name=' + req.body.recvUserName);
        // params.push('recv_gate_id=' + req.body.recvGateId);
        params.push('mer_date=' + merDate);
        params.push('order_id=' + orderId);
        var bill = {};
        bill.amount = req.body.amount;
        bill.orderId = orderId;
        bill.merDate = merDate;
        bill.added = new Date();
        bill.updated = new Date();
        bill.merProjectId = req.body.merProjectId;
        bill.bank = {
            'brname': req.body.recvBankBrhname,
            'userName': req.body.recvUserName,
            'account': req.body.recvAccount
        };
        bill.type = 2;
        base.MerDirectBill.create(bill)
            .then(function (model) {
                bill = model;
                return base.mer.makeUrl(params, 1);
            })
            .then(function (url) {
                console.log(url);
                return base.mer.get(url);
            })
            .then(function (query) {
                bill.isSucceed = true;
                bill.updated = new Date();
                bill.save();
                res.end(JSON.stringify(query));
            })
            .then(undefined, function (err) {
                console.error(err.stack);
                bill.errMessage = err.toString();
                bill.save();
                res.status(500)
                    .end(JSON.stringify({
                        err: err.toString()
                    }));
            });
    });

router.route('/directbill')
    .get(function (req, res, next) {
        base.MerDirectBill.find({})
            .then(function (list) {
                res.render('mer-directbill', {
                    list: list
                });
            });
    });


module.exports = router;

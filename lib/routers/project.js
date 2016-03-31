var router = require('express')
    .Router(),
    multipart = require('connect-multiparty'),
    excel = require('excel4node'),
    path = require('path'),
    util = require('../utils'),
    base = require('../base'),
    Q = require('q');

function getPaid(projectId, type, callback) {
    var deferred = Q.defer();
    var find = {};
    if (type === 'paid') {
        find = {
            'project': projectId,
            'state': 1
        };
    } else if (type === 'unpaid') {
        find = {
            'project': projectId,
            'state': 2
        };
    } else {
        find = {
            'project': projectId,
            '$or': [{
                'state': 1
            }, {
                'state': 2
            }]
        };
    }
    var list = base.Order.getStatisticList(find);
    var payable = base.Order.getPayable(projectId);
    var paid = base.Order.getPaid(projectId);
    var promises = [payable, paid, list];
    deferred.resolve(promises);
    return deferred.promise.nodeify(callback);
}

function exportPaid(sheet, list, callback) {
    var deferred = Q.defer();
    var states = ['意向', '已付款', '选中', '拒绝', '退款'];
    var row = 2;
    var column = 0;
    var order = {};
    for (var i = 0; i < list.length; i++) {
        order = list[i];
        column = 1;
        sheet.Cell(row, column++)
            .String(order.user.realname || '');
        sheet.Cell(row, column++)
            .String(order.user.company || '');
        sheet.Cell(row, column++)
            .String(order.user.position || '');
        if (order.planAmount === 0) {
            sheet.Cell(row, column++)
                .Number(order.amount);
        } else {
            sheet.Cell(row, column++)
                .Number(order.planAmount);
        }
        sheet.Cell(row, column++)
            .Number(order.amount);
        sheet.Cell(row, column++)
            .String(order.user.mobile || '');
        sheet.Cell(row, column++)
            .String(order.user.email);
        sheet.Cell(row, column++)
            .String(order.describe || '');
        sheet.Cell(row, column++)
            .String(states[order.state]);
        sheet.Cell(row, column++)
            .String(order.user.username.toString());
        sheet.Cell(row, column++)
            .String(order._id.toString());
        sheet.Cell(row, column++)
            .Date(order.added);
        row++;
    }
    sheet.Cell(row, 4)
        .Format.Font.Bold();
    sheet.Cell(row, 4)
        .String('认购总额');
    sheet.Cell(row, 5)
        .Format.Font.Bold();
    sheet.Cell(row, 5)
        .Formula('SUM(E2:E' + (row - 1) + ')');
    deferred.resolve({
        'row': row,
        'column': column
    });
    return deferred.promise.nodeify(callback);

}

router.route('/')
    .get(function (req, res, next) {
        base.Project.list(req.app.locals.ckuid, function (err, result) {
            res.render('project', {
                projects: result
            });
        });
    });

router.route('/new')
    .post(function (req, res, next) {
        var body = req.body;
        base.Project.validateAlias(body.alias, function (err, result) {
            if (err) {
                res.redirect('/project');
            } else {
                if (result) {
                    body.openDate = new Date(body.openDate.getFullYear(),
                        body.openDate
                        .getMonth(),
                        body.openDate.getDate());
                    body.closeDate = new Date(body.closeDate.getFullYear(),
                        body.closeDate
                        .getMonth(),
                        body.closeDate.getDate());
                    body.closePayDate = new Date(body.closePayDate.getFullYear(),
                        body.closePayDate
                        .getMonth(),
                        body.closePayDate.getDate());
                    (body.owner === '') && (delete body.owner);
                    base.Project.create(body, function (err, result) {
                        res.redirect('/project');
                    });
                }
            }
        });
    })
    .get(function (req, res, next) {
        res.render('project-new', {
            uploadAPI: base.config.uploadAPI,
            skills: base.config.plug.skills,
            turns: base.config.plug.turns
        });
    });

var curProject, curId, curCat, jadeName, curURL;
router.route('/:id/activity')
    .all(function (req, res, next) {
        curId = req.params.id;
        next();
    })
    .post(function (req, res, next) {
        var body = req.body;
        console.log(body);
        base.Activity.create(body, function (err, result) {
            res.redirect('/project/' + curId + '/Activity');
        });
    })
    .get(function (req, res, next) {
        base.Activity.listByProject(curId, req.app.locals.ckuid, function (
            err, result) {
            res.render('project-activity', {
                uploadAPI: base.config.uploadAPI,
                projectId: curId,
                activities: result,
                state: base.config.plug.activity
            });
        });
    });

router.route('/:id/orders')
    .get(function (req, res, next) {
        curId = req.params.id;
        base.Order.ordersByProject(curId, function (err, result) {
            res.render('project-orders', {
                projectId: curId,
                orders: result
            });
        });
    });

router.route('/:id/orders/export')
    .get(function (req, res, next) {
        var wb = new excel.WorkBook(),
            ws = wb.WorkSheet('项目订单');
        curId = req.params.id;
        base.Order.ordersByProject(curId, function (err, result) {
            var order;
            var r = 1,
                c,
                lines = [],
                states = ['意向', '已付款', '选中', '拒绝', '退款'],
                headers = ['真实姓名', '公司', '职位', '认购额', '手机', '邮箱',
                    '理由', '状态', '用户名', '订单号', '下单时间'
                ];
            for (var i = 0, l = headers.length; i < l; i++) {
                ws.Cell(r, i + 1)
                    .String(headers[i]);
                ws.Cell(r, i + 1)
                    .Format.Font.Bold();
            }
            while (order = result.pop()) {
                r++;
                c = 1;
                ws.Cell(r, c++)
                    .String(order.user.realname || '');
                ws.Cell(r, c++)
                    .String(order.user.company || '');
                ws.Cell(r, c++)
                    .String(order.user.position || '');
                ws.Cell(r, c++)
                    .Number(order.amount);
                ws.Cell(r, c++)
                    .String(order.user.mobile || '');
                ws.Cell(r, c++)
                    .String(order.user.email);
                ws.Cell(r, c++)
                    .String(order.describe || '');
                ws.Cell(r, c++)
                    .String(states[order.state]);
                ws.Cell(r, c++)
                    .String(order.user.username.toString());
                ws.Cell(r, c++)
                    .String(order._id.toString());
                ws.Cell(r, c++)
                    .Date(order.added);
            }
            r++;
            ws.Cell(r, 3)
                .Format.Font.Bold();
            ws.Cell(r, 3)
                .String('认购总额');
            ws.Cell(r, 4)
                .Format.Font.Bold();
            ws.Cell(r, 4)
                .Formula('SUM(D2:D' + (r - 1) + ')');
            wb.write(curId + '.xlsx', res);
        });
    });

router.route('/:id/contract')
    .all(function (req, res, next) {
        curId = req.params.id;
        next();
    })
    .post(multipart(), function (req, res, next) {
        var file = req.files.uploadFile;
        var newName = base.md5(Math.random());
        var filePath = path.join(base.config.filePath, curId);
        var filename = req.body.filename.trim();
        var fullPath = path.join(filePath, newName);
        var data = req.body.data;
        var id = req.body.id;
        if (!id && file.size === 0) {
            // 新建但未选择文件
            res.render('project-contract', {
                list: [],
                error: '请选择上传的文件。'
            });
        } else if (file.size && base.file.getExt(file.name) !== 'docx') {
            // 文件扩展名不对
            res.render('project-contract', {
                list: [],
                error: '请选择一个 docx 文件。'
            });
        } else {
            if (file.size && filename === '') {
                // 上传文件但未设置文件名
                filename = file.name;
            } else if (base.file.getExt(filename) !== 'docx') {
                // 未设置文件扩展名
                filename += '.docx';
            }
            // 更新数据
            var update = {
                project: curId,
                filename: filename,
                data: data
            };
            if (file.size) {
                base.file.mkdir(filePath);
                base.file.mv(file.path, fullPath);
                // 上传了文件则更新文件数据
                update.path = fullPath;
            }
            base.Contract.findOneAndUpdate(
                id ? {
                    _id: id
                } : {
                    project: curId,
                    filename: filename
                }, update, {
                    upsert: true
                },
                function (err, result) {
                    // 删除原文件
                    result && file.size && base.file.remove(result.path);
                    res.redirect('/project/' + curId + '/contract');
                });
        }
    })
    .get(function (req, res, next) {
        base.Contract.getListByProject(curId, function (err, list) {
            res.render('project-contract', {
                list: list
            });
        });
    });

router.route('/:id/contract/:cid/delete')
    .get(function (req, res, next) {
        base.Contract.findOneAndRemove({
            _id: req.params.cid
        }, function (err, result) {
            result && base.file.remove(result.path);
            res.redirect('/project/' + req.params.id + '/contract');
        });
    });

router.route('/:id/:cat')
    .all(function (req, res, next) {
        curId = req.params.id;
        curCat = req.params.cat;
        curURL = '/project/' + curId + '/' + curCat;
        jadeName = 'project-' + curCat;
        base.Project.one({
            _id: curId
        }, function (err, result) {
            curProject = result;
            next();
        });
    })
    .get(function (req, res, next) {
        res.render(jadeName, {
            project: curProject.toJSON({
                getters: false
            }),
            uploadAPI: base.config.uploadAPI,
            skills: base.config.plug.skills,
            turns: base.config.plug.turns
        });
    })
    .post(function (req, res, next) {
        switch (curCat) {
            case 'product':
            case 'point':
            case 'info':
                //base.Project.findOneAndUpdate({_id: curId}, req.body, function(err, result) {
                var body = req.body;
                (body.owner === '') && (delete body.owner);
                curProject.update(body, function (err, result) {
                    res.redirect(curURL);
                });
                break;
            case 'team':
                curProject.team.push(req.body);
                curProject.update({
                    team: curProject.team
                }, function (err, result) {
                    res.redirect(curURL);
                });
                break;
            default:
                res.redirect('/project/' + curId);
                break;
        }
    });

router.route('/:id/team/:teamid')
    .post(function (req, res, next) {
        base.Project.one({
            _id: req.params.id
        }, function (err, project) {
            var team = project.team.id(req.params.teamid);
            for (var key in req.body) {
                team[key] = req.body[key];
            }
            project.update({
                team: project.team
            }, function () {});
            res.redirect('/project/' + req.params.id + '/team');
        });
    });

router.route('/:id/team/:teamid/delete')
    .get(function (req, res, next) {
        base.Project.one({
            _id: req.params.id
        }, function (err, project) {
            project.team.pull(req.params.teamid);
            project.update({
                team: project.team
            }, function () {});
            res.redirect('/project/' + req.params.id + '/team');
        });
    });

router.route('/:id/activity/:aid')
    .all(function (req, res, next) {
        curId = req.params.id;
        next();
    })
    .post(function (req, res, next) {
        base.Activity
            .update({
                _id: req.params.aid
            }, req.body, function (err, result) {
                res.redirect('/project/' + curId + '/activity');
            });
    })
    .get(function (req, res, next) {
        var aid = req.params.aid;
        base.Activity
            .findOne({
                _id: aid,
                project: curId
            })
            .populate({
                path: 'users',
                select: 'username realname email position company added'
            })
            .exec(function (err, result) {
                res.render('project-join', {
                    uploadAPI: base.config.uploadAPI,
                    projectId: curId,
                    users: result.users
                });
            });
    });

router.route('/:id/activity/:aid/delete')
    .get(function (req, res, next) {
        base.Activity.remove({
            _id: req.params.aid
        }, function (err, result) {
            res.redirect('/project/' + req.params.id + '/activity');
        });
    });

router.route('/:id/orders/paid/details')
    .get(function (req, res, next) {
        var type = req.query.type || 'payable';
        var projectId = req.params.id;
        var statistics = {};

        getPaid(projectId, type)
            .then(function (promises) {
                return Q.all(promises);
            })
            .then(function (result) {
                statistics.payable = result[0];
                statistics.paid = result[1];

                res.render('project-order-paid', {
                    statistics: statistics,
                    orders: result[2],
                    projectId: req.params.id
                });
            });
    });

router.route('/:id/orders/paid/export')
    .get(function (req, res, next) {
        var statistics = {};
        var projectId = req.params.id;
        var allList = base.Order.getStatisticList({
            'project': projectId,
            '$or': [{
                'state': 1
            }, {
                'state': 2
            }]
        });
        var paidList = base.Order.getStatisticList({
            'project': projectId,
            'state': 1
        });
        var unpaidList = base.Order.getStatisticList({
            'project': projectId,
            'state': 2
        });
        var payable = base.Order.getPayable(projectId);
        var paid = base.Order.getPaid(projectId);
        var promises = [payable, paid, allList, paidList, unpaidList];
        var wb = new excel.WorkBook(),
            statisticsSheet = wb.WorkSheet('统计'),
            allSheet = wb.WorkSheet('应付款'),
            paidSheet = wb.WorkSheet('已付款'),
            unpaidSheet = wb.WorkSheet('未付款');
        var headers = ['真实姓名', '公司', '职位', '拟认购额', '实际认购金额', '手机', '邮箱',
            '理由', '状态', '用户名', '订单号', '下单时间'
        ];
        var statisticsHeaders = ['应付款', '已付款', '未付款', '应付款人数', '已付款人数',
            '未付款人数'
        ];
        for (var i = 0; i < headers.length; i++) {
            allSheet.Cell(1, i + 1)
                .String(headers[i]);
            allSheet.Cell(1, i + 1)
                .Format.Font.Bold();
            paidSheet.Cell(1, i + 1)
                .String(headers[i]);
            paidSheet.Cell(1, i + 1)
                .Format.Font.Bold();
            unpaidSheet.Cell(1, i + 1)
                .String(headers[i]);
            unpaidSheet.Cell(1, i + 1)
                .Format.Font.Bold();
        }
        for (i = 0; i < statisticsHeaders.length; i++) {
            statisticsSheet.Cell(1, i + 1)
                .String(statisticsHeaders[i]);
            statisticsSheet.Cell(1, i + 1)
                .Format.Font.Bold();
        }
        Q.all(promises)
            .then(function (result) {
                statistics.payable = result[0];
                statistics.paid = result[1];
                statistics.allList = result[2];
                statistics.paidList = result[3];
                statistics.unpaidList = result[4];
                statisticsSheet.Cell(2, 1)
                    .Number(statistics.payable.sum);
                statisticsSheet.Cell(2, 2)
                    .Number(statistics.paid.sum);
                statisticsSheet.Cell(2, 3)
                    .Number(statistics.payable.sum - statistics.paid.sum);
                statisticsSheet.Cell(2, 4)
                    .Number(statistics.payable.count);
                statisticsSheet.Cell(2, 5)
                    .Number(statistics.paid.count);
                statisticsSheet.Cell(2, 6)
                    .Number(statistics.payable.count - statistics.paid.count);
                return true;
            })
            .then(function (success) {
                promises = [];
                promises.push(exportPaid(allSheet, statistics.allList));
                promises.push(exportPaid(paidSheet, statistics.paidList));
                promises.push(exportPaid(unpaidSheet, statistics.unpaidList));
                return Q.all(promises);
            })
            .then(function (result) {
                wb.write(projectId + '.xlsx', res);
            })
            .then(undefined, function (err) {
                console.error(err.stack);
                res.end(err);
            });

    });

module.exports = router;

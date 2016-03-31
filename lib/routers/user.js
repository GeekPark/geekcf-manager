var router = require('express')
    .Router(),
    excel = require('excel4node'),
    util = require('../utils'),
    base = require('../base');

function fixreg(str) {
    var reg = /([\.\?\+\*\-\[\]\{\}\(\)\^\$\,\\])/g;
    return str.replace(reg, '\\$1');
}

router.route('/')
    .get(function (req, res, next) {
        var t = req.query.t,
            q = req.query.q,
            p = Math.max(1, req.query.p || 1),
            count = req.query.c || 20,
            start = (p - 1) * count,
            find = {};
        switch (t) {
            case 'i':
                find.isInvestor = true;
                break;
            case 'n':
                find.isInvestor = false;
                break;
            case 'a':
                find.isInvestor = false;
                find.applyInvestor = true;
                break;
            case 'r1':
                find.certified = 1;
                break;
            case 'r2':
                find.certified = 2;
                break;
            case 'r3':
                find.certified = 3;
                break;
            default:
                if (q) {
                    var reg = new RegExp(fixreg(q), 'i');
                    find = {
                        $or: [{
                            username: reg
                        }, {
                            email: reg
                        }, {
                            mobile: reg
                        }, {
                            realname: reg
                        }, {
                            company: reg
                        }, {
                            position: reg
                        }]
                    };
                }
                break;
        }
        base
            .User
            .find(find)
            .sort({
                added: -1
            })
            .skip(start)
            .limit(count)
            .exec(function (err, users) {
                base.User.find(find)
                    .count(function (err, result) {
                        res.render('user', {
                            users: users,
                            count: result,
                            t: t,
                            p: p,
                            c: count,
                            q: q
                        });
                    });
            });
    });

router.route('/export')
    .get(function (req, res, next) {
        var wb = new excel.WorkBook(),
            ws = wb.WorkSheet('用户列表');
        var find = {};
        if (req.query.type === 'investor') {
            find = {
                isInvestor: true
            };
        } else if (req.query.type === 'notInvestor') {
            find = {
                isInvestor: false
            };
        }
        base.User.find(find, function (err, result) {
            var user;
            var r = 1,
                c,
                headers = ['用户名', '姓名', '邮箱', '手机', '公司', '职位'];
            for (var i = 0, l = headers.length; i < l; i++) {
                ws.Cell(r, i + 1)
                    .String(headers[i]);
                ws.Cell(r, i + 1)
                    .Format.Font.Bold();
            }
            while (user = result.pop()) {
                r++;
                c = 1;
                ws.Cell(r, c++)
                    .String(user.username || '');
                ws.Cell(r, c++)
                    .String(user.realname || '');
                ws.Cell(r, c++)
                    .String(user.email || '');
                ws.Cell(r, c++)
                    .String(user.mobile || '');
                ws.Cell(r, c++)
                    .String(user.company || '');
                ws.Cell(r, c++)
                    .String(user.position || '');
            }
            wb.write('users.xlsx', res);
        });
    });

router.route('/:id/:act')
    .get(function (req, res, next) {
        base.User.findOneAndUpdate({
            _id: req.params.id
        }, {
            isInvestor: req.params.act === 'yes'
        }, {
            new: true
        }, function (err, result) {
            // if(result.isInvestor && result.mobile) {
            //     base.sms.init(base.config.sms.yunpian.apikey);
            //     base.sms.sendSms({
            //         mobile: result.mobile,
            //         text: '恭喜！您的投资人资格已通过认证，可以进入 http://geeks.vc 进行认购了。回T退订'
            //     }, function(err, body) {
            //         console.log(err, body);
            //     });
            // }
            res.json({
                _id: result._id,
                isInvestor: result.isInvestor
            });
        });
    });

router.route('/certified')
    .post(function (req, res, next) {
        base.User.findOne({
            _id: req.body._id
        }, function (err, result) {
            result.certified = Number(req.body.certified);
            if (result.certified === 2) {
                result.isInvestor = true;
            }
            result.save();
            notifyCertified(req.app.locals.domain, result);
            res.json({
                _id: result._id,
                certified: result.certified
            });
        });
    });

function notifyCertified(domain, user) {
    "use strict";
    if (user.mobile) {
        if (user.certified === 2) {
            base.sms.init(base.config.sms.yunpian.apikey);
            base.sms.sendSms({
                mobile: user.mobile,
                text: '恭喜！您的投资人资格已通过认证，可以进入 http://geeks.vc 进行认购了。回T退订'
            }, function (err, body) {
                console.log(err, body);
            });
            var type = 'notifyCertified';
            var param = {};
            var checkUrl = 'http://' + domain;
            param.userEmail = user.email;
            param.replaceParams = [];
            param.replaceParams.push({
                'regexp': '#userName',
                'replacement': user.realname
            });
            param.replaceParams.push({
                'regexp': '#checkUrl',
                'replacement': checkUrl
            });
            base.mailer.sendEmailByTemplate(type, param, function (err, result) {
                console.log(err, result);
            });
            let content = base.config.plug.newsTemplates.certified;
            base.UserFeed.send(content, [user._id],
                    base.UserFeed.type.user)
                .then(undefined, function (err) {
                    console.error(err);
                });
        } else if (user.certified === 3) {
            base.sms.init(base.config.sms.yunpian.apikey);
            base.sms.sendSms({
                mobile: user.mobile,
                text: '很遗憾，您的实名认证信息未通过审核，请进入 http://geeks.vc 重新提交信息。回T退订'
            }, function (err, body) {
                console.log(err, body);
            });
            var type = 'notifyNotCertified';
            var param = {};
            var certifiedUrl = 'http://' + domain + '/settings/certified';
            param.userEmail = user.email;
            param.replaceParams = [];
            param.replaceParams.push({
                'regexp': '#userName',
                'replacement': user.realname
            });
            param.replaceParams.push({
                'regexp': '#certifiedUrl',
                'replacement': certifiedUrl
            });
            base.mailer.sendEmailByTemplate(type, param, function (err, result) {
                console.log(err, result);
            });
            let content = base.config.plug.newsTemplates.notCertified;
            base.UserFeed.send(content, [user._id],
                    base.UserFeed.type.user)
                .then(undefined, function (err) {
                    console.error(err);
                });

        }
    }
}

module.exports = router;

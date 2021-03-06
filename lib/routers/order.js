var router = require('express')
    .Router(),
    base = require('../base');

router.route('/:id/delete')
    .get(function (req, res, next) {
        base.Order.findOne({
                _id: req.params.id
            })
            .then(function (order) {
                var url = '/project' + '/' + order.project + '/orders';
                order.remove();
                res.redirect(url);
            });
    });

router.route('/:id/state')
    .put(function (req, res, next) {
        base.Order.findOne({
                _id: req.params.id
            })
            .populate({
                path: 'project',
                select: 'title alias'
            })
            .populate({
                path: 'user',
                select: 'realname email mobile'
            })
            .then(function (order) {
                // "use strict";
                order.state = req.body.state;
                if (order.state === 1) {
                    order.payId = req.body.payId;
                    order.payType = 'BankTransfer';
                    order.bankType = req.body.bankType;
                    order.amount = req.body.amount;
                } else if (order.state === 2) {
                    if (order.planAmount === 0) {
                        order.planAmount = order.amount;
                    }
                    order.amount = req.body.amount;
                }
                order.save();
                var type = '';
                var params = {};
                switch (order.state) {
                    case 1:
                        type = 'notifyPay';
                        param = {};
                        param.userEmail = order.user.email;
                        param.replaceParams = [];
                        param.replaceParams.push({
                            'regexp': '#userName',
                            'replacement': order.user.realname
                        });
                        param.replaceParams.push({
                            'regexp': '#projectTitle',
                            'replacement': order.project.title
                        });
                        param.replaceParams.push({
                            'regexp': '#amount',
                            'replacement': order.amount
                        });
                        base.mailer.sendEmailByTemplate(type, param);
                        order.isSendEmail = true;
                        order.save();
                        break;
                    case 2:
                        type = 'notifySubscriber';
                        param = {};
                        var payUrl = base.config.property.webUrl +
                            '/project/' + order.project.alias + '/pay';
                        var payHelpUrl = base.config.property.webUrl +
                            '/about/help';
                        param.userEmail = order.user.email;
                        param.replaceParams = [];
                        param.replaceParams.push({
                            'regexp': '#userName',
                            'replacement': order.user.realname
                        });
                        param.replaceParams.push({
                            'regexp': '#projectTitle',
                            'replacement': order.project.title
                        });
                        param.replaceParams.push({
                            'regexp': '#planAmount',
                            'replacement': order.planAmount
                        });
                        param.replaceParams.push({
                            'regexp': '#amount',
                            'replacement': order.amount
                        });
                        param.replaceParams.push({
                            'regexp': '#payUrl',
                            'replacement': payUrl
                        });
                        param.replaceParams.push({
                            'regexp': '#payHelpUrl',
                            'replacement': payHelpUrl
                        });
                        base.mailer.sendEmailByTemplate(type, param);
                        //保存动态
                        var content = base.config.plug.newsTemplates.subscriber;
                        content = base.replaceUrl(content, '{title}',
                            order.project.title);
                        content = base.replaceUrl(content, '{alias}',
                            order.project.alias);
                        base.UserFeed.send(content, [order.user._id],
                                base.UserFeed.type.project)
                            .then(undefined, function (err) {
                                console.error(err);
                            });
                        break;
                    case 3:
                        //保存动态
                        var content = base.config.plug.newsTemplates.refuse;
                        content = base.replaceUrl(content, '{title}',
                            order.project.title);
                        content = base.replaceUrl(content, '{alias}',
                            order.project.alias);
                        base.UserFeed.send(content, [order.user._id],
                                base.UserFeed.type.project)
                            .then(undefined, function (err) {
                                console.error(err);
                            });
                        break;
                    case 4:
                        break;
                }
                res.end();
            });
    });

module.exports = router;

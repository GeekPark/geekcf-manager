var router = require('express').Router(),
    base = require('../base');

router.route('/:id/delete').get(function(req, res, next) {
    base.Order.findOne({
            _id: req.params.id
        })
        .then(function(order) {
            var url = '/project' + '/' + order.project + '/orders';
            order.remove();
            res.redirect(url);
        });
});

router.route('/:id/state')
    .put(function(req, res, next) {
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
            .then(function(order) {
                order.state = req.body.state;
                order.save();
                switch (order.state) {
                    case 2:
                        var type = 'notifySubscriber';
                        var param = {};
                        var payUrl = 'http://' + req.app.locals.domain + '/project/' + order.project.alias + '/pay';
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
                            'regexp': '#payUrl',
                            'replacement': payUrl
                        });
                        base.mailer.sendEmailByTemplate(type, param);
                        break;
                    case 3:
                        break;
                }
                res.end();
            });
    });

module.exports = router;
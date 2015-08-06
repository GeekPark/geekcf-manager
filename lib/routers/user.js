var router = require('express').Router(),
    util = require('../utils'),
    base = require('../base');

router.route('/')
.get(function(req, res, next) {
    base.User.list(function(err, result) {
        res.render('user', {users: result});
    });
});

router.route('/export')
.get(function(req, res, next) {
    base.User.find({isInvestor: true}, function(err, result) {
        var user;
        res.setHeader('Content-disposition', 'attachment; filename=users.xls');
        res.setHeader('Content-type', 'text/plain; charset=utf-8');
        var lines = [],
            headers = ['用户名', '姓名', '邮箱', '手机', '公司', '职位'];
        lines.push(headers.join('\t'));
        while(user = result.pop()) {
            var fields = [];
            fields.push(user.username);
            fields.push(user.realname);
            fields.push(user.email);
            fields.push(user.mobile);
            fields.push(user.company);
            fields.push(user.position);
            lines.push(fields.join('\t'));
        }
        res.write(lines.join('\r\n'));
        res.end();
    });
});

router.route('/:id/:act')
.get(function(req, res, next) {
    base.User.findOneAndUpdate({
        _id: req.params.id
    }, {
        isInvestor: req.params.act === 'yes'
    }, {
        new: true
    }, function(err, result) {
        res.json({_id: result._id, isInvestor: result.isInvestor});
    });
});

module.exports = router;

var router = require('express').Router(),
    util = require('../utils'),
    base = require('../base');

function fixreg (str) {
    var reg = /([\.\?\+\*\-\[\]\{\}\(\)\^\$\,\\])/g;
    return str.replace(reg, '\\$1');
}

router.route('/')
.get(function(req, res, next) {
    var t = req.query.t,
        q = req.query.q,
        p = Math.max(1, req.query.p || 1),
        count = req.query.c || 20,
        start = (p - 1) * count,
        find = {};
    switch(t) {
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
        case 'r0':
            find.certified = undefined;
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
            if(q) {
                var reg = new RegExp(fixreg(q), 'i');
                find = {$or: [
                    {username: reg},
                    {email: reg},
                    {mobile: reg},
                    {realname: reg},
                    {company: reg},
                    {position: reg}
                ]};
            }
            break;
    }
    base
        .User
        .find(find)
        .sort({added: -1})
        .skip(start)
        .limit(count)
        .exec(function(err, users) {
            console.log(find, err, users);
            base.User.find(find).count(function(err, result) {
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
        if(result.isInvestor && result.mobile) {
            base.sms.init(base.config.sms.yunpian.apikey);
            base.sms.sendSms({
                mobile: result.mobile,
                text: '恭喜！您的投资人资格已通过认证，可以进入 http://geeks.vc 进行认购了。回T退订'
            }, function(err, body) {
                console.log(err, body);
            });
        }
        res.json({_id: result._id, isInvestor: result.isInvestor});
    });
});

router.route('/certified')
.post(function(req, res, next){
    base.User.findOne({
        _id:req.body._id
    },function(err,result){
        result.certified = Number(req.body.certified);
        result.save();
        if (result.certified === 2 && result.mobile) {
            base.sms.init(base.config.sms.yunpian.apikey);
            base.sms.sendSms({
                mobile: result.mobile,
                text: '恭喜！您的实名认证已经通过，可以进入 http://geeks.vc 进行认购了。回T退订'
            }, function(err, body) {
                console.log(err, body);
            });
        }
        res.json({_id: result._id, certified: result.certified});
    });
});

module.exports = router;

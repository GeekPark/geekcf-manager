var router = require('express').Router(),
    multipart = require('connect-multiparty'),
    csv = require('csv'),
    base = require('../base'),
    sms = base.sms;

router.route('/')
.get(function(req, res, next) {
    res.render('tool');
});

router.route('/import')
.post(multipart(), function(req, res, next) {
    var file = req.files.uploadFile;
    var content = base.file.read(file.path);
    var count = 0, times = 0;
    csv.parse(content, function(err, data) {
        res.write('开始导入...\n');
        for(var vip, user, oauth, i=1, l=data.length; i<l; i++) {
            count = l - 1;
            vip = data[i];
            user = {
                username: vip[1],
                realname: vip[2],
                mobile: vip[3],
                email: vip[4],
                company: vip[5],
                position: vip[6],
                bio: vip[7],
                isInvestor: true
            };
            oauth = {
                site: 'geekpark.net',
                uid: vip[0]
            };
            addData(user, oauth);
        }
    });
    function addData(user, oauth) {
        base.OAuth.findOne(oauth, function(err, result) {
            if(result) {
                echo(oauth.uid + ' _重复_');
            } else {
                base.User.create(user, function(err, result) {
                    oauth.user = result._id;
                    base.OAuth.create(oauth, function(err, result) {
                        echo(oauth.uid + ' *成功*');
                    });
                });
            }
        });
    }
    function echo(str) {
        res.write('(' + ++times + '/' + count + ') ' + str + '\n');
        if(times >= count) {
            res.end();
        }
    }
})
.get(function(req, res, next) {
    res.render('tool-import');
});

router.route('/mail')
.get(function(req, res, next) {
    res.render('tool-mail', {
        uploadAPI: base.config.uploadAPI
    });
})
.post(function(req, res, next) {
    var body = req.body,
        email = new base.mailer.Email();
    email.setFrom('no-reply@geeks.vc');
    email.setFromName('极客加速');
    email.setSubject(body.subject);
    email.setHtml(body.text);
    if(body.testMail) {
        email.addTo(body.testMail);
    }
    if(body.group) {
        var find = {};
        switch(body.group) {
            case 'i':
                find.isInvestor = true;
                break;
            case 'n':
                find.isInvestor = false;
                break;
            case 'e':
                find = {
                    $or: [
                        {realname: null},
                        {mobile: null},
                        {company: null},
                        {position: null}
                    ]
                }
                break;
            default:
                // nothing...
                break;
        }
        base.User.find(find, function(err, users) {
            var user;
            while(user = users.pop()) {
                email.addTo(user.email);
            }
            sendMail();
            //res.json({msg: email.toString()});
        });
    } else {
        sendMail();
        //res.json({msg: email.toString()});
    }

    function sendMail() {
        base.mailer.send(email, function(err, result) {
            res.json({msg: err ? err.toString() : '发送成功'});
        });
    }
});

router.route('/sms')
.all(function(req, res, next) {
    sms.init(base.config.sms.yunpian.apikey);
    next();
})
.get(function(req, res, next) {
    sms.getTemplate({}, function(err, body) {
        res.render('tool-sms', JSON.parse(body));
    });
})
.post(function(req, res, next) {
    var investor = !!req.body.investor,
        notInvestor = !!req.body.notInvestor,
        hash = {mobile: req.body.testMobile, text: req.body.text};
    // TODO get user group
    sms.sendSms(hash, function(err, body) {
        res.send({a:investor,b:notInvestor});
    });
});

module.exports = router;

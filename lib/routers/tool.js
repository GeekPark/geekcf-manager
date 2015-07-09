var router = require('express').Router(),
    multipart = require('connect-multiparty'),
    csv    = require('csv'),
    base   = require('../base');

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

module.exports = router;

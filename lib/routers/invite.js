var router = require('express').Router(),
    util = require('../utils'),
    base = require('../base');

router.route('/')
.get(function(req, res, next) {
    base.Invite.list(function(err, invites){
        res.render('invite', {
            qrapi: base.config.qrapiURL,
            webURL: base.config.webURL,
            invites: invites
        });
    });
});

router.route('/create')
.post(function(req, res, next) {
    base.Invite.newOne(parseInt(req.body.nums), function(err, result) {
        res.redirect('/invite');
    });
});

router.route('/:id')
.get(function(req, res, next) {
    base.Invite.getUsers(req.params.id, function(err, result) {
        console.log(result);
        res.render('invite-users', {
            users: result.users
        });
    });
});

module.exports = router;

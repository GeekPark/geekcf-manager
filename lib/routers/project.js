var router = require('express').Router(),
    util = require('../utils'),
    base = require('../base');

router.route('/')
.post(function(req, res, next) {
    base.Project.create(req.body, function(err, result) {
        res.redirect('/project');
    });
})
.get(function(req, res, next) {
    base.Project.list(function(err, result) {
        res.render('project', {projects: result});
    });
});

router.route('/new')
.get(function(req, res, next) {
    res.render('project-new', {
        skills: base.config.plug.skills,
        turns: base.config.plug.turns
    });
})

module.exports = router;

var router = require('express').Router(),
    util = require('../utils'),
    base = require('../base');

router.route('/')
.post(function(req, res, next) {
    base.Project.create({title: 'test project'}, function(err, result) {
        util.debug(req.body.skills);
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
    res.render('project-new', {skills: base.config.plug.skills});
})

module.exports = router;

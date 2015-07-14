var router = require('express').Router(),
    util = require('../utils'),
    base = require('../base');

router.route('/')
.get(function(req, res, next) {
    base.Project.list(function(err, result) {
        res.render('project', {projects: result});
    });
});

router.route('/new')
.post(function(req, res, next) {
    base.Project.create(req.body, function(err, result) {
        res.redirect('/project');
    });
})
.get(function(req, res, next) {
    res.render('project-new', {
        skills: base.config.plug.skills,
        turns: base.config.plug.turns
    });
})

var curProject, curId, curCat, jadeName, curURL;
router.route('/:id/:cat')
.all(function(req, res, next) {
    curId = req.params.id;
    curCat = req.params.cat;
    curURL = '/project/' + curId + '/' + curCat;
    jadeName = 'project-' + curCat;
    base.Project.one(req.params.id, function(err, result) {
        curProject = result;
        next();
    });
})
.get(function(req, res, next) {
    res.render(jadeName, {
        project: curProject.toObject(),
        skills: base.config.plug.skills,
        turns: base.config.plug.turns
    });
})
.post(function(req, res, next) {
    console.log(req.body, curId);
    switch(curCat) {
        case 'info':
            //base.Project.findOneAndUpdate({_id: curId}, req.body, function(err, result) {
            curProject.update(req.body, function(err, result) {
                res.redirect(curURL);
            });
            break;
        case 'team':
            curProject.team.push({
                name: 'team a'
            });
            curProject.save(function(err, result) {
                res.redirect(curURL);
            });
            break;
        default:
            break;
    }
});

module.exports = router;

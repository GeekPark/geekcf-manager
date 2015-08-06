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
    base.Project.validateAlias(req.body.alias,function(err,result){
        if (err) {
            next(err);
        } else {
            if (result) {
                base.Project.create(req.body, function(err, result) {
                    res.redirect('/project');
                });
            };
        }
    });
})
.get(function(req, res, next) {
    res.render('project-new', {
        skills: base.config.plug.skills,
        turns: base.config.plug.turns
    });
});

var curProject, curId, curCat, jadeName, curURL;
router.route('/:id/activity')
.all(function(req, res, next) {
    curId = req.params.id;
    next();
})
.post(function(req, res, next) {
    var body = req.body;
    base.Activity.create(body, function(err, result) {
        res.redirect('/project/' + curId + '/Activity');
    });
})
.get(function(req, res, next) {
    base.Activity.listByProject(curId, function(err, result) {
        res.render('project-activity', {projectId: curId, activities: result});
    });
});

router.route('/:id/orders')
.get(function(req, res, next) {
    curId = req.params.id;
    base.Order.ordersByProject(curId, function(err, result) {
        res.render('project-orders', {projectId: curId, orders: result});
    });
});

router.route('/:id/orders/export')
.get(function(req, res, next) {
    curId = req.params.id;
    base.Order.ordersByProject(curId, function(err, result) {
        var order;
        res.setHeader('Content-disposition', 'attachment; filename=' + curId + '.xls');
        res.setHeader('Content-type', 'text/plain');
        var lines = [],
            headers = ['订单号', '额度','用户名','真实姓名', '邮箱', '手机', '公司', '职位', '下单时间'];
        lines.push(headers.join('\t'));
        while(order = result.pop()) {
            var fields = [];
            fields.push(order._id);
            fields.push(order.amount);
            fields.push(order.user.username);
            fields.push(order.user.realname);
            fields.push(order.user.email);
            fields.push(order.user.mobile);
            fields.push(order.user.company);
            fields.push(order.user.position);
            fields.push(order.added);
            lines.push(fields.join('\t'));
        }
        res.write(lines.join('\r\n'));
        res.end();
    });
});

router.route('/:id/:cat')
.all(function(req, res, next) {
    curId = req.params.id;
    curCat = req.params.cat;
    curURL = '/project/' + curId + '/' + curCat;
    jadeName = 'project-' + curCat;
    base.Project.one({_id: curId}, function(err, result) {
        curProject = result;
        next();
    });
})
.get(function(req, res, next) {
    res.render(jadeName, {
        project: curProject.toJSON({getters: false}),
        uploadAPI: base.config.uploadAPI,
        skills: base.config.plug.skills,
        turns: base.config.plug.turns
    });
})
.post(function(req, res, next) {
    switch(curCat) {
        case 'info':
            //base.Project.findOneAndUpdate({_id: curId}, req.body, function(err, result) {
            var body = req.body;
            (body.owner === '') && (delete body.owner);
            curProject.update(req.body, function(err, result) {
                res.redirect(curURL);
            });
            break;
        case 'team':
            curProject.team.push(req.body);
            curProject.update({team: curProject.team}, function(err, result) {
                res.redirect(curURL);
            });
            break;
        default:
            res.redirect('/project/' + curId);
            break;
    }
});

router.route('/:id/team/:teamid')
.post(function(req, res, next) {
    base.Project.one({_id: req.params.id}, function(err, project) {
        var team = project.team.id(req.params.teamid);
        for(var key in req.body) {
            team[key] = req.body[key];
        }
        project.update({team: project.team}, function(){});
        res.redirect('/project/' + req.params.id + '/team');
    });
});

router.route('/:id/team/:teamid/delete')
.get(function(req, res, next){
    base.Project.one({_id: req.params.id}, function(err, project) {
        project.team.pull(req.params.teamid);
        project.update({team: project.team}, function(){});
        res.redirect('/project/' + req.params.id + '/team');
    });
});

router.route('/:id/activity/:aid')
.all(function(req, res, next) {
    curId = req.params.id;
    next();
})
.post(function(req, res, next) {
    base.Activity
        .update({_id: req.params.aid}, req.body, function(err, result) {
            res.redirect('/project/' + curId + '/activity');
        });
})
.get(function(req, res, next) {
    var aid = req.params.aid;
    base.Activity
        .findOne({_id: aid, project: curId})
        .populate({path: 'users', select: 'username realname email position company added'})
        .exec(function(err, result) {
            res.render('project-join', {projectId: curId, users: result.users});
        });
});

router.route('/:id/activity/:aid/delete')
.get(function(req, res, next){
    base.Activity.remove({_id: req.params.aid}, function(err, result) {
        res.redirect('/project/' + req.params.id + '/activity');
    });
});

module.exports = router;

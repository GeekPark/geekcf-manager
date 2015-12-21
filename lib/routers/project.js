var router = require('express').Router(),
    multipart = require('connect-multiparty'),
    excel = require('excel4node'),
    path = require('path'),
    util = require('../utils'),
    base = require('../base');

router.route('/')
.get(function(req, res, next) {
    base.Project.list(req.app.locals.ckuid, function(err, result) {
        res.render('project', {projects: result});
    });
});

router.route('/new')
.post(function(req, res, next) {
    var body = req.body;
    base.Project.validateAlias(body.alias,function(err,result){
        if (err) {
            res.redirect('/project');
        } else {
            if (result) {
                (body.owner === '') && (delete body.owner);
                base.Project.create(body, function(err, result) {
                    res.redirect('/project');
                });
            };
        }
    });
})
.get(function(req, res, next) {
    res.render('project-new', {
        uploadAPI: base.config.uploadAPI,
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
    base.Activity.listByProject(curId, req.app.locals.ckuid, function(err, result) {
        res.render('project-activity', {
            uploadAPI: base.config.uploadAPI,
            projectId: curId,
            activities: result,
            state: base.config.plug.activity
        });
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
    var wb = new excel.WorkBook(),
        ws = wb.WorkSheet('项目订单');
    curId = req.params.id;
    base.Order.ordersByProject(curId, function(err, result) {
        var order;
        var r = 1, c,
            lines = [],
            states = ['意向', '已付款', '选中', '拒绝', '退款'],
            headers = ['真实姓名', '公司', '职位', '认购额', '手机', '邮箱', '理由', '状态', '用户名', '订单号', '下单时间'];
        for(var i=0, l=headers.length; i<l; i++) {
            ws.Cell(r, i + 1).String(headers[i]);
            ws.Cell(r, i + 1).Format.Font.Bold();
        }
        while(order = result.pop()) {
            r++;
            c = 1;
            ws.Cell(r, c++).String(order.user.realname || '');
            ws.Cell(r, c++).String(order.user.company || '');
            ws.Cell(r, c++).String(order.user.position || '');
            ws.Cell(r, c++).Number(order.amount);
            ws.Cell(r, c++).String(order.user.mobile || '');
            ws.Cell(r, c++).String(order.user.email);
            ws.Cell(r, c++).String(order.describe || '');
            ws.Cell(r, c++).String(states[order.state]);
            ws.Cell(r, c++).String(order.user.username.toString());
            ws.Cell(r, c++).String(order._id.toString());
            ws.Cell(r, c++).Date(order.added);
        }
        r++;
        ws.Cell(r, 3).Format.Font.Bold();
        ws.Cell(r, 3).String('认购总额');
        ws.Cell(r, 4).Format.Font.Bold();
        ws.Cell(r, 4).Formula('SUM(D2:D' + (r -1) + ')');
        wb.write(curId + '.xlsx', res);
    });
});

router.route('/:id/contract')
.all(function(req, res, next) {
    curId = req.params.id;
    next();
})
.post(multipart(), function(req, res, next) {
    var file = req.files.uploadFile;
    var newName = base.md5(Math.random());
    var filePath = path.join(base.config.filePath, curId);
    var filename = req.body.filename.trim();
    var fullPath = path.join(filePath, newName);
    var data = req.body.data;
    var id = req.body.id;
    if(file.size === 0) {
        res.render('project-contract', {list: [], error: '请选择上传的文件。'});
    } else if(base.file.getExt(file.name) !== 'docx') {
        res.render('project-contract', {list: [], error: '请选择一个 docx 文件。'});
    } else {
        if(filename === '') {
            filename = file.name;
        } else if(base.file.getExt(filename) !== 'docx') {
            filename += '.docx';
        }
        base.file.mkdir(filePath);
        base.file.mv(file.path, fullPath);
        base.Contract.findOneAndUpdate(
        id ? {_id: id} : {
            project: curId,
            filename: filename
        }, {
            project: curId,
            filename: filename,
            path: fullPath,
            data: data
        }, {
            upsert: true
        }, function(err, result) {
            result && base.file.remove(result.path);
            res.redirect('/project/' + curId + '/contract');
        });
    }
})
.get(function(req, res, next) {
    base.Contract.getListByProject(curId, function(err, list) {
        res.render('project-contract', {list: list});
    });
});

router.route('/:id/contract/:cid/delete')
.get(function(req, res, next) {
    base.Contract.findOneAndRemove({_id: req.params.cid}, function(err, result) {
        result && base.file.remove(result.path);
        res.redirect('/project/' + req.params.id + '/contract');
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
        case 'product':
        case 'point':
        case 'info':
            //base.Project.findOneAndUpdate({_id: curId}, req.body, function(err, result) {
            var body = req.body;
            (body.owner === '') && (delete body.owner);
            curProject.update(body, function(err, result) {
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
            res.render('project-join', {
                uploadAPI: base.config.uploadAPI,
                projectId: curId,
                users: result.users
            });
        });
});

router.route('/:id/activity/:aid/delete')
.get(function(req, res, next){
    base.Activity.remove({_id: req.params.aid}, function(err, result) {
        res.redirect('/project/' + req.params.id + '/activity');
    });
});

module.exports = router;

var base = require('./base');


module.exports = function (rule) {
    return function (req, res, next) {
        // 创建检查项
        function checkItem(level, routes) {
            for (var key in routes) {
                if (typeof routes === "number") {
                    return routes;
                } else {
                    if (key === pathInfo[level] || key === '*') {
                        return checkItem(level + 1, routes[key]);
                    }
                }
            }
            return -1;
        }

        // 权限审查
        function check(permission) {
            if (permission >= 0) {
                if (permission <= req.app.locals.admin.role) {
                    next();
                } else {
                    res.redirect('http://' + req.app.locals
                        .domain);
                }
            } else {
                res.redirect('http://' + req.app.locals
                    .domain);
            }
        }
        var pathInfo;
        if (req.path === '/') {
            pathInfo = ['', req.path];
        } else {
            pathInfo = req.path.toLowerCase()
                .split('/');
        }
        var checkRoutes = rule;
        check(checkItem(1, checkRoutes));
    };

};

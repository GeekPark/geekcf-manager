// 对应admin中的role 0 为普通管理员，1 为超级管理员
module.exports = {
    '/': {
        '*': 0
    },
    'project': {
        '*': 1
    },
    'meruser': 1,
    'applying': 0,
    'mysterious': 1,
    'text': 0,
    'invite': 0,
    'order': 1,
    'data': 0,
    'tool': 1,
    'user': 1
};

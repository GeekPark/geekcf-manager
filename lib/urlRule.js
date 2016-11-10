// 对应admin中的role 0 为普通管理员，1 为超级管理员
module.exports = {
    '/': {
        '*': 0
    },
    'adviser': 0,
    'applying': 0,
    'data': 0,
    'invite': 0,
    'mer': 1,
    'mysterious': 0,
    'order': 1,
    'project': {
        'new': 1,
        'info': 1,
        '*': 0
    },
    'text': 0,
    'tool': {
        'admin': 1,
        '*': 0
    },
    'user': 0
};

$(document).ready(function() {
    $('#loginForm').on('submit', function(e) {
        e.preventDefault();
        
        const username = $('#username').val();
        const password = $('#password').val();

        // 从本地存储获取用户数据
        const users = JSON.parse(localStorage.getItem('users')) || [];

        // 验证用户
        const user = users.find(u => u.username === username && u.password === password);

        if (user) {
            alert('登录成功！');
            // 这里可以添加登录成功后的操作，比如跳转到主页
            window.location.href = 'index.html';
        } else {
            alert('用户名或密码错误，请重试。');
        }
    });
});
$(document).ready(function() {
    const jobOpenings = [
        { title: "产品经理", department: "产品部", location: "上海" },
        { title: "前端开发工程师", department: "技术部", location: "北京" },
        { title: "UI/UX设计师", department: "设计部", location: "广州" },
        { title: "市场营销专员", department: "市场部", location: "深圳" }
    ];

    // 动态添加职位列表
    const jobList = $('#job-list');
    jobOpenings.forEach(job => {
        jobList.append(`
            <div class="col-md-6 mb-4">
                <div class="card">
                    <div class="card-body">
                        <h5 class="card-title">${job.title}</h5>
                        <p class="card-text">部门：${job.department}</p>
                        <p class="card-text">地点：${job.location}</p>
                        <a href="#application-form" class="btn btn-primary">申请职位</a>
                    </div>
                </div>
            </div>
        `);
    });

    // 动态添加职位选项
    const positionSelect = $('#position');
    jobOpenings.forEach(job => {
        positionSelect.append(`<option value="${job.title}">${job.title}</option>`);
    });

    // 处理表单提交
    $('#job-application-form').on('submit', function(e) {
        e.preventDefault();
        
        const application = {
            name: $('#name').val(),
            email: $('#email').val(),
            phone: $('#phone').val(),
            position: $('#position').val(),
            coverLetter: $('#cover-letter').val(),
            applicationDate: new Date().toISOString()
        };

        const applications = JSON.parse(localStorage.getItem('jobApplications')) || [];
        applications.push(application);
        localStorage.setItem('jobApplications', JSON.stringify(applications));

        alert('感谢您的申请！我们会尽快与您联系。');
        this.reset();
    });

    // 添加导出求职信息的功能
    $('body').append('<button id="exportApplications" class="btn btn-secondary mt-3">导出求职信息</button>');
    
    $('#exportApplications').on('click', function() {
        const applications = JSON.parse(localStorage.getItem('jobApplications')) || [];
        const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(applications, null, 2));
        const downloadAnchorNode = document.createElement('a');
        downloadAnchorNode.setAttribute("href", dataStr);
        downloadAnchorNode.setAttribute("download", "careers.json");
        document.body.appendChild(downloadAnchorNode);
        downloadAnchorNode.click();
        downloadAnchorNode.remove();
    });
});
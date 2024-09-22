$(document).ready(function() {
    // 初始化轮播图
    $(".owl-carousel").owlCarousel({
        items: 1,
        loop: true,
        autoplay: true,
        autoplayTimeout: 3000,
        autoplayHoverPause: true
    });

    // 聊天功能
    const chatMessages = document.getElementById('chat-messages');
    const userInput = document.getElementById('user-input');
    const sendButton = document.getElementById('send-button');
    const chatWidget = document.getElementById('chat-widget');
    const chatIcon = document.getElementById('chat-icon');
    const chatContainer = document.getElementById('chat-container');
    const closeChat = document.getElementById('close-chat');
    const fullscreenChat = document.getElementById('fullscreen-chat');

    let ws;
    let currentResponse = '';
    let typingInterval;
    let thinkingAnimation;
    let isFullscreen = false;

    // WebSocket连接
    function connectWebSocket() {
        const url = getAuthUrl();
        console.log("尝试连接到WebSocket URL:", url);
        ws = new WebSocket(url);

        ws.onopen = function(evt) {
            console.log("WebSocket连接已建立");
            addMessage('系统', '小溪助手已准备就绪，请输入您的问题。');
        };

        ws.onmessage = function(evt) {
            console.log("收到消息:", evt.data);
            try {
                const response = JSON.parse(evt.data);
                handleResponse(response);
            } catch (error) {
                console.error("解析响应时出错:", error);
                addMessage('系统', '处理响应时出现错误，请稍后再试。');
            }
        };

        ws.onerror = function(evt) {
            console.error("WebSocket错误：", evt);
            addMessage('系统', '连接出错，请稍后再试。');
        };

        ws.onclose = function(evt) {
            console.log("WebSocket连接已关闭，代码：", evt.code, "原因：", evt.reason);
            addMessage('系统', '连接已断开，正在尝试重新连接...');
            setTimeout(connectWebSocket, 5000);
        };
    }

    // 用于生成鉴权url的函数
    function getAuthUrl() {
        const apiKey = "1d2d6584e796d11dd9e4adcd86060241";
        const apiSecret = "OWNiOTE4ZGQ5OTJiNDBkOGFmNTNhN2Fi";
        const host = "spark-openapi.cn-huabei-1.xf-yun.com";
        const path = "/v1/chat";
        const date = new Date().toUTCString();
        const algorithm = "hmac-sha256";
        const headers = "host date request-line";
        const signatureOrigin = `host: ${host}\ndate: ${date}\nGET ${path} HTTP/1.1`;
        const signatureSha = CryptoJS.HmacSHA256(signatureOrigin, apiSecret);
        const signature = CryptoJS.enc.Base64.stringify(signatureSha);
        const authorizationOrigin = `api_key="${apiKey}", algorithm="${algorithm}", headers="${headers}", signature="${signature}"`;
        const authorization = btoa(authorizationOrigin);

        return `wss://${host}${path}?authorization=${authorization}&date=${date}&host=${host}`;
    }

    function handleResponse(response) {
        console.log("处理响应:", response);
        if (response.header.code === 0) {
            if (response.payload.choices.status === 2) {
                currentResponse += response.payload.choices.text[0].content;
                stopThinkingAnimation();
                typeMessage('小溪助手', currentResponse);
                currentResponse = '';
            } else if (response.payload.choices.status === 1) {
                currentResponse += response.payload.choices.text[0].content;
                console.log("累积的响应:", currentResponse);
            }
        } else {
            console.error("错误：", response.header.message);
            stopThinkingAnimation();
            addMessage('系统', `抱歉，处理您的请求时出现了问题：${response.header.message}`);
        }
    }

    function startThinkingAnimation() {
        const thinkingElement = document.createElement('div');
        thinkingElement.classList.add('message', 'assistant', 'thinking');
        thinkingElement.innerHTML = '小溪助手正在思考<span class="dots"></span>';
        chatMessages.appendChild(thinkingElement);
        scrollToBottom();

        let dots = 0;
        thinkingAnimation = setInterval(() => {
            dots = (dots + 1) % 4;
            thinkingElement.querySelector('.dots').textContent = '.'.repeat(dots);
        }, 500);
    }

    function stopThinkingAnimation() {
        clearInterval(thinkingAnimation);
        const thinkingElement = chatMessages.querySelector('.thinking');
        if (thinkingElement) {
            thinkingElement.remove();
        }
    }

    function typeMessage(sender, message) {
        const messageElement = document.createElement('div');
        messageElement.classList.add('message', sender === '用户' ? 'user' : 'assistant');
        messageElement.innerHTML = `${sender}: <span class="typed-text"></span>`;
        chatMessages.appendChild(messageElement);

        const typedTextElement = messageElement.querySelector('.typed-text');
        let index = 0;

        clearInterval(typingInterval);
        typingInterval = setInterval(() => {
            if (index < message.length) {
                typedTextElement.textContent += message[index];
                index++;
                scrollToBottom();
            } else {
                clearInterval(typingInterval);
            }
        }, 30);
    }

    function scrollToBottom() {
        chatMessages.scrollTop = chatMessages.scrollHeight;
    }

    function addMessage(sender, message) {
        if (sender === '用户') {
            const messageElement = document.createElement('div');
            messageElement.classList.add('message', 'user');
            messageElement.textContent = `${sender}: ${message}`;
            chatMessages.appendChild(messageElement);
            startThinkingAnimation();
        } else {
            typeMessage(sender, message);
        }
        scrollToBottom();
        
        if (chatContainer.style.display === 'none') {
            showNotification();
        }
    }

    function showNotification() {
        chatIcon.classList.add('notification');
        setTimeout(() => {
            chatIcon.classList.remove('notification');
        }, 1000);
    }

    function sendMessage(message) {
        const request = {
            header: {
                app_id: "f0b4ae34",
                uid: "user123"
            },
            parameter: {
                chat: {
                    domain: "general",
                    temperature: 0.5,
                    top_k: 4,
                    max_tokens: 2048,
                    chat_id: "chat_1234"
                }
            },
            payload: {
                message: {
                    text: [
                        {
                            role: "user",
                            content: message
                        }
                    ]
                }
            }
        };

        console.log("发送消息:", request);

        if (ws.readyState === WebSocket.OPEN) {
            ws.send(JSON.stringify(request));
        } else {
            console.log("WebSocket未连接，当前状态:", ws.readyState);
            stopThinkingAnimation();
            addMessage('系统', '连接未就绪，正在尝试重新连接...');
            connectWebSocket();
        }
    }

    function handleUserInput() {
        const message = userInput.value.trim();
        if (message) {
            addMessage('用户', message);
            userInput.value = '';
            sendMessage(message);
        }
    }

    function toggleFullscreen() {
        isFullscreen = !isFullscreen;
        chatWidget.classList.toggle('fullscreen', isFullscreen);
        fullscreenChat.innerHTML = isFullscreen ? '<i class="fas fa-compress"></i>' : '<i class="fas fa-expand"></i>';
        
        if (isFullscreen) {
            chatWidget.style.width = '100vw';
            chatWidget.style.height = '100vh';
        } else {
            chatWidget.style.width = '300px';
            chatWidget.style.height = '400px';
        }
    }

    // 事件监听器
    sendButton.addEventListener('click', handleUserInput);
    userInput.addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
            handleUserInput();
        }
    });

    chatIcon.addEventListener('click', function() {
        chatContainer.style.display = 'flex';
        chatIcon.style.display = 'none';
        if (!isFullscreen) {
            chatWidget.style.height = '400px';
            chatWidget.style.width = '300px';
        }
        chatWidget.style.bottom = '30px';
        chatWidget.style.right = '30px';
    });

    closeChat.addEventListener('click', function() {
        chatContainer.style.display = 'none';
        chatIcon.style.display = 'flex';
        chatWidget.style.height = 'auto';
        chatWidget.style.width = 'auto';
        if (isFullscreen) {
            isFullscreen = false;
            chatWidget.classList.remove('fullscreen');
            fullscreenChat.innerHTML = '<i class="fas fa-expand"></i>';
        }
        chatWidget.style.bottom = '30px';
        chatWidget.style.right = '30px';
    });

    fullscreenChat.addEventListener('click', toggleFullscreen);

    // 平滑滚动
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            e.preventDefault();
            document.querySelector(this.getAttribute('href')).scrollIntoView({
                behavior: 'smooth'
            });
        });
    });

    // 初始化WebSocket连接
    connectWebSocket();

    // 在$(document).ready函数中添加
    $(".square-carousel").owlCarousel({
        items: 1,
        loop: true,
        autoplay: true,
        autoplayTimeout: 5000,
        autoplayHoverPause: true,
        nav: true,
        dots: true
    });
});
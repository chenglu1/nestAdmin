const https = require('https');
const http = require('http');

// 构建请求选项
const options = {
  hostname: '118.89.79.13',
  port: 80,
  path: '/api/auth/logout',
  method: 'POST',
  headers: {
    'Accept': 'application/json, text/plain, */*',
    'Accept-Language': 'zh-CN,zh;q=0.9',
    'Authorization': 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOjQsInVzZXJuYW1lIjoidGVzdCIsImlhdCI6MTc2Mzg2NTYwNCwiZXhwIjoxNzY0NDcwNDA0fQ.TpUK7Zaziqf2wJhOKS6dq-xCtI64g9W48Vj3n0HtcOw',
    'Content-Length': 0,
    'Origin': 'http://118.89.79.13',
    'Proxy-Connection': 'keep-alive',
    'Referer': 'http://118.89.79.13/home',
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36',
    'Cookie': 'f1ac58a672b3c1346bffaa1763fa3a3a=9b1fd887-e95b-4f49-8a7e-1667a1ce32d9.LOFAqRHA35oBLfF8WUqGsQ2B0Ko; http_Path=%2Fwww%2Fwwwroot%2FnestAdmin%2Fbackend%2Fdist%2Fmodules'
  }
};

// 发送请求
const req = http.request(options, (res) => {
  console.log(`状态码: ${res.statusCode}`);
  console.log('响应头:', res.headers);
  
  let data = '';
  res.on('data', (chunk) => {
    data += chunk;
  });
  
  res.on('end', () => {
    console.log('响应体:', data);
  });
});

req.on('error', (e) => {
  console.error(`请求错误: ${e.message}`);
});

// 发送请求体（空）
req.write('');
req.end();
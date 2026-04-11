const http = require('http');

const postData = JSON.stringify({
  name: 'testuser',
  email: 'testuser_' + Date.now() + '@school.com',
  password: 'password123',
  grade: 'sec3'
});

const req = http.request(
  {
    hostname: '127.0.0.1',
    port: 5000,
    path: '/api/auth/register',
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Content-Length': Buffer.byteLength(postData)
    }
  },
  (res) => {
    let data = '';
    res.on('data', chunk => data += chunk);
    res.on('end', () => {
      const parsed = JSON.parse(data);
      console.log('Token:', parsed.token);
      
      const req2 = http.request({
        hostname: '127.0.0.1',
        port: 5000,
        path: '/api/auth/me',
        method: 'GET',
        headers: { Authorization: 'Bearer ' + parsed.token }
      }, (res2) => {
        let d2 = '';
        res2.on('data', c => d2 += c);
        res2.on('end', () => {
          console.log('Me result:', res2.statusCode, d2);
        });
      });
      req2.end();
    });
  }
);

req.on('error', e => console.error(e));
req.write(postData);
req.end();

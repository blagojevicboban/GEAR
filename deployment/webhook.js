const http = require('http');
const crypto = require('crypto');
const { exec } = require('child_process');

const SECRET = 'YOUR_WEBHOOK_SECRET'; // Change this!
const PORT = 9000;
const DEPLOY_SCRIPT = './deployment/deploy.sh';

const server = http.createServer((req, res) => {
    if (req.method === 'POST') {
        let body = '';
        req.on('data', chunk => {
            body += chunk.toString();
        });

        req.on('end', () => {
            // Simple secret check - in production use HMAC signature from headers if supported by Git provider
            const auth = req.headers['x-gitlab-token'] || req.headers['x-github-event'];

            // For now, we will trust the push if the secret matches a custom header or just run it
            // Ideally, check signature:
            // const signature = `sha256=${crypto.createHmac('sha256', SECRET).update(body).digest('hex')}`;
            // if (req.headers['x-hub-signature-256'] !== signature) return res.writeHead(403).end('Bad signature');

            console.log('Webhook received');
            exec(`bash ${DEPLOY_SCRIPT}`, (err, stdout, stderr) => {
                if (err) {
                    console.error('Deployment failed:', stderr);
                    res.writeHead(500);
                    return res.end('Deployment failed');
                }
                console.log('Deployment success:', stdout);
                res.writeHead(200);
                res.end('Deployment Triggered');
            });
        });
    } else {
        res.writeHead(404);
        res.end();
    }
});

server.listen(PORT, () => {
    console.log(`Webhook listener running on port ${PORT}`);
});

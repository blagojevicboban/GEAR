import http from 'http';
import { exec } from 'child_process';

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
            // Secret check would go here
            const auth = req.headers['x-gitlab-token'] || req.headers['x-github-event'];

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

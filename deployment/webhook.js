import http from 'http';
import { exec } from 'child_process';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

// Load .env from root
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, '../.env') });

const SECRET = process.env.WEBHOOK_SECRET;
const PORT = 9000;
const DEPLOY_SCRIPT = './deployment/deploy.sh';

const server = http.createServer((req, res) => {
    if (req.method === 'POST') {
        let body = '';
        req.on('data', chunk => {
            body += chunk.toString();
        });

        req.on('end', () => {
            // Verify GitHub Signature
            if (SECRET) {
                const signature = req.headers['x-hub-signature-256'];
                if (!signature) {
                    console.error('No signature found on request');
                    res.writeHead(401);
                    return res.end('No signature found');
                }

                // Import crypto dynamically
                import('crypto').then(crypto => {
                    const hmac = crypto.createHmac('sha256', SECRET);
                    const digest = 'sha256=' + hmac.update(body).digest('hex');

                    if (signature !== digest) {
                        console.error('Webhook signature mismatch');
                        res.writeHead(403);
                        return res.end('Signature mismatch');
                    }

                    // Signature valid, proceed
                    triggerDeploy(res);
                });
            } else {
                // No secret configured, just proceed (less secure)
                triggerDeploy(res);
            }
        });
    } else {
        res.writeHead(404);
        res.end();
    }
});

function triggerDeploy(res) {
    console.log('Webhook received, starting deployment...');
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
}

server.listen(PORT, () => {
    console.log(`Webhook listener running on port ${PORT}`);
});

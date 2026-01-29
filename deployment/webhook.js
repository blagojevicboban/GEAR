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
        req.on('data', (chunk) => {
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
                import('crypto').then((crypto) => {
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

    // Use spawn instead of exec to stream output
    // This ensures we see logs even if the process is killed during execution (e.g. by pm2 restart)
    import('child_process').then(({ spawn }) => {
        const child = spawn('bash', [DEPLOY_SCRIPT]);

        child.stdout.on('data', (data) => {
            console.log(data.toString().trim());
        });

        child.stderr.on('data', (data) => {
            console.error(data.toString().trim());
        });

        child.on('close', (code) => {
            if (code === 0) {
                console.log(
                    'Deployment script execution finished successfully.'
                );
                if (!res.writableEnded) {
                    res.writeHead(200);
                    res.end('Deployment Triggered & Script Finished');
                }
            } else {
                console.error(`Deployment process exited with code ${code}`);
                if (!res.writableEnded) {
                    res.writeHead(500);
                    res.end('Deployment Failed');
                }
            }
        });

        child.on('error', (err) => {
            console.error('Failed to start deployment script:', err);
            if (!res.writableEnded) {
                res.writeHead(500);
                res.end('Deployment Script Error');
            }
        });
    });
}

server.listen(PORT, () => {
    console.log(`Webhook listener running on port ${PORT}`);
});

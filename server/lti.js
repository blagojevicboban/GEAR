import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const ltiLib = require('ltijs');
const Provider = ltiLib.Provider;
import { Sequelize } from 'sequelize';
import Database from 'ltijs-sequelize';
import pool from './db.js';

// Setup LTI Provider
// ltijs exports a singleton instance
const lti = Provider;

console.log('LTI DB Config:', {
    user: process.env.DB_USER,
    db: process.env.DB_NAME,
    host: process.env.DB_HOST
});

lti.setup(process.env.LTI_KEY || 'GEAR_LTI_KEY',
    {
        // Database Configuration: Use Sequelize Plugin
        plugin: new Database(
            process.env.DB_NAME || 'gear',
            process.env.DB_USER || 'gear',
            process.env.DB_PASSWORD || 'Tsp-2024',
            {
                host: process.env.DB_HOST || 'localhost',
                dialect: 'mysql',
                logging: console.log
            }
        )
    },
    {
        // Options
        appUrl: '/',
        loginUrl: '/lti/login',
        logger: true,
        cookies: {
            secure: false, // Set true in production with HTTPS
            sameSite: 'None'
        },
        devMode: true // Allow localhost
    }
);

// Verify connection and setup routes
const setupLTI = async (app) => {
    // Mount LTI routes under /lti
    app.use('/lti', lti.app);

    // Handle Successful Launch
    lti.onConnect(async (token, req, res) => {
        const platform = await lti.getPlatform(token.iss);
        const userEmail = token.user.email || token.user.name + '@lms.com'; // Fallback if email hidden
        const roles = token.roles || [];

        console.log(`LTI Launch: ${userEmail} with roles: ${roles}`);

        // Mapping LTI Roles to GEAR Roles
        // Standard LTI Roles: 
        // http://purl.imsglobal.org/vocab/lis/v2/institution/person#Instructor
        // http://purl.imsglobal.org/vocab/lis/v2/membership#Learner
        let gearRole = 'student';
        if (roles.some(r => r.includes('Instructor') || r.includes('Administrator'))) {
            gearRole = 'teacher'; // Map Instructor to Teacher. Admin integration is risky without explicit trust.
        }

        try {
            // Find or Create User
            const [users] = await pool.query('SELECT * FROM users WHERE email = ?', [userEmail]);

            let userId;
            if (users.length === 0) {
                // Provision new user
                userId = 'user-lti-' + Date.now();
                await pool.query(
                    'INSERT INTO users (id, username, email, institution, password, role) VALUES (?, ?, ?, ?, ?, ?)',
                    [userId, token.user.name || 'LTI User', userEmail, 'LTI Provider', 'lti-provisioned', gearRole]
                );
                console.log('Provisioned new LTI user:', userId);
            } else {
                userId = users[0].id;
                // Update role if changed? Maybe better to keep manual overrides.
                // For now, respect existing user.
            }

            // Redirect to Frontend with a session token or simple cookie
            // For this quick integration, passing username in query param is insecure but functional for prototype
            // Better: Issue a JWT here.

            // Actually, ltijs sets a session cookie. We can verify it on separate endpoints if we use lti.app.
            // But our existing API uses custom logic. 
            // Let's redirect to a special frontend route `/lti-callback` that handles the "login".

            return res.redirect(`/?lti_user=${encodeURIComponent(userEmail)}&lti_role=${gearRole}`);

        } catch (err) {
            console.error(err);
            return res.status(500).send('LTI Provisioning Error');
        }
    });

    await lti.deploy({ serverless: true }); // Serverless mode means it doesn't start its own express server, just attaches

    // Register Platform (For testing, usually done dynamically or via UI)
    // lti.registerPlatform({
    //     url: 'https://moodle.tsp.edu.rs',
    //     name: 'Moodle',
    //     clientId: 'CLIENTID',
    //     authenticationEndpoint: '...',
    //     accesstokenEndpoint: '...',
    //     authConfig: { method: 'JWK_SET', key: '...' }
    // });
};

export default setupLTI;

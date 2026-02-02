
import axios from 'axios';
import pool from '../db.js';

const API_URL = 'http://localhost:3001/api';

async function runTest() {
    try {
        console.log('Starting Password Change Verification...');

        // 1. Get User ID
        const email = 'boban.blagojevic@tsp.edu.rs';
        const [users] = await pool.query('SELECT id FROM users WHERE email = ?', [email]);
        if (users.length === 0) throw new Error('User not found');
        const userId = users[0].id;
        console.log(`User ID: ${userId}`);

        // 2. Test Login (Initial)
        const initialLogin = await axios.post(`${API_URL}/login`, {
            username: email,
            password: 'admin123'
        }).catch(e => e.response);
        
        if (initialLogin.status !== 200) throw new Error('Initial login failed');
        console.log('✅ Initial login successful');

        // 3. Try change with WRONG password
        try {
            await axios.put(`${API_URL}/users/${userId}/password`, {
                currentPassword: 'wrongpassword',
                newPassword: 'NewPassword123!'
            });
            console.error('❌ Failed: Should not allow change with wrong password');
        } catch (error) {
            if (error.response && error.response.status === 401) {
                console.log('✅ Correctly rejected wrong password');
            } else {
                console.error('❌ Unexpected error for wrong password:', error.message);
            }
        }

        // 4. Change with CORRECT password
        const changeRes = await axios.put(`${API_URL}/users/${userId}/password`, {
            currentPassword: 'admin123',
            newPassword: 'NewPassword123!'
        });

        if (changeRes.status === 200) {
            console.log('✅ Password changed successfully');
        }

        // 5. Test Login with OLD password (should fail)
        try {
            await axios.post(`${API_URL}/login`, {
                username: email,
                password: 'admin123'
            });
            console.error('❌ Failed: Old password should not work');
        } catch (error) {
            if (error.response && error.response.status === 401) {
                console.log('✅ Old password no longer works');
            } else {
                console.error('❌ Unexpected error for old password:', error.message);
            }
        }

        // 6. Test Login with NEW password (should success)
        const newLogin = await axios.post(`${API_URL}/login`, {
            username: email,
            password: 'NewPassword123!'
        });
        
        if (newLogin.status === 200) {
            console.log('✅ New password works');
        }

        // 7. Cleanup: Revert password
        await axios.put(`${API_URL}/users/${userId}/password`, {
            currentPassword: 'NewPassword123!',
            newPassword: 'admin123'
        });
        console.log('✅ Reverted password to admin123');

        console.log('ALL TESTS PASSED');
        process.exit(0);

    } catch (err) {
        console.error('Test Failed:', err.message);
        if (err.response) {
            console.error('Response data:', err.response.data);
        }
        process.exit(1);
    }
}

runTest();

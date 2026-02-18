import axios from 'axios';

async function testMaterialSearch() {
    console.log('Testing Materials API Search (Integration)...');

    try {
        // 1. Test Search for "Si" - Should use the DB-stored key now!
        console.log('--- Test 1: Simple Formula "Si" ---');
        const res1 = await axios.get(
            'http://localhost:3001/api/materials/search?query=Si'
        );
        console.log('Result:', {
            status: res1.status,
            source: res1.data.source,
            error: res1.data.error,
            count: res1.data.data ? res1.data.data.length : 0,
        });
    } catch (error) {
        console.error('Test Failed:', error.message);
        if (error.response) {
            console.error('Response:', error.response.data);
        }
    }
}

testMaterialSearch();

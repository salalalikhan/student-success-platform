// Test script to verify signup and login work together
const axios = require('axios');

async function testSignupAndLogin() {
    const baseURL = 'http://localhost:3001';
    
    // Test data
    const testUser = {
        name: 'Test User',
        email: 'newuser@test.com',
        password: 'testpassword123',
        confirmPassword: 'testpassword123'
    };
    
    try {
        console.log('Testing signup...');
        
        // Test signup
        const signupResponse = await axios.post(`${baseURL}/api/auth/signup`, testUser);
        console.log('✅ Signup successful:', signupResponse.data);
        
        console.log('\nTesting login with new credentials...');
        
        // Test login with the new credentials
        const loginResponse = await axios.post(`${baseURL}/api/auth/login`, {
            email: testUser.email,
            password: testUser.password
        });
        
        console.log('✅ Login successful:', loginResponse.data);
        
        console.log('\n🎉 Authentication flow is now working correctly!');
        console.log('Users can now sign up and then sign in with those credentials.');
        
    } catch (error) {
        console.error('❌ Test failed:', error.response?.data || error.message);
    }
}

testSignupAndLogin();
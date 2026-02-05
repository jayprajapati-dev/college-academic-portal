const axios = require('axios');

const testLogin = async () => {
  try {
    console.log('Testing login API...\n');
    
    const response = await axios.post('http://localhost:5000/api/auth/login', {
      identifier: 'admin@smartacademic.com',
      password: 'admin123'
    });
    
    console.log('Response Status:', response.status);
    console.log('Response Data:', JSON.stringify(response.data, null, 2));
    
    if (response.data.success) {
      console.log('\n✅ Login Successful!');
      console.log('User:', response.data.user.name);
      console.log('Role:', response.data.user.role);
      console.log('Token:', response.data.token.substring(0, 20) + '...');
    } else {
      console.log('\n❌ Login Failed:', response.data.message);
    }
  } catch (error) {
    console.error('❌ Error:', error.response?.data || error.message);
  }
};

testLogin();

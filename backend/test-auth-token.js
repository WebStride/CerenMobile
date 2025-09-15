const twilio = require('twilio');
require('dotenv').config();

console.log('🔍 Checking Twilio Auth Token...');

// Test with the current .env values
const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
const serviceSid = process.env.TWILIO_VERIFY_SERVICE_SID;

console.log('Current .env values:');
console.log('- Account SID:', accountSid);
console.log('- Service SID:', serviceSid);
console.log('- Auth Token (first 10 chars):', authToken ? authToken.substring(0, 10) + '...' : 'NOT SET');

if (!authToken) {
  console.error('❌ TWILIO_AUTH_TOKEN is not set in .env file');
  process.exit(1);
}

const client = twilio(accountSid, authToken);

async function testAuthToken() {
  try {
    console.log('\\n🧪 Testing authentication...');

    // Test 1: Get account info
    const account = await client.api.accounts(accountSid).fetch();
    console.log('✅ Account access successful:', account.friendlyName);

    // Test 2: Get verification service
    const service = await client.verify.v2.services(serviceSid).fetch();
    console.log('✅ Service access successful:', service.friendlyName);

    // Test 3: Try to create a verification (this will help identify if auth token is correct)
    console.log('\\n📤 Testing verification creation...');
    const testPhone = '+917077404655'; // Use the same phone number from your working code

    const verification = await client.verify.v2.services(serviceSid)
      .verifications
      .create({
        to: testPhone,
        channel: 'sms',
      });

    console.log('✅ Verification creation successful!');
    console.log('Verification SID:', verification.sid);
    console.log('Status:', verification.status);

    console.log('\\n🎉 All tests passed! Your auth token appears to be correct.');

  } catch (error) {
    console.error('\\n❌ Authentication test failed!');
    console.error('Error:', error.message);
    console.error('Error code:', error.code);

    if (error.code === 20003) {
      console.error('\\n💡 This usually means the AUTH TOKEN is incorrect.');
      console.error('Please check your TWILIO_AUTH_TOKEN in the .env file.');
    } else if (error.code === 20404) {
      console.error('\\n💡 This usually means the SERVICE SID is incorrect.');
      console.error('Please check your TWILIO_VERIFY_SERVICE_SID in the .env file.');
    } else if (error.code === 21211) {
      console.error('\\n💡 This usually means the phone number format is invalid.');
    }

    console.error('\\n🔧 Suggested fix:');
    console.error('1. Go to https://console.twilio.com');
    console.error('2. Copy your Account SID and Auth Token');
    console.error('3. Update your .env file with the correct values');
  }
}

testAuthToken();

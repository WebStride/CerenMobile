const twilio = require('twilio');
require('dotenv').config();

const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
const serviceSid = process.env.TWILIO_VERIFY_SERVICE_SID;

console.log('Testing Twilio credentials...');
console.log('Account SID:', accountSid);
console.log('Service SID:', serviceSid);
console.log('Auth Token (first 10 chars):', authToken ? authToken.substring(0, 10) + '...' : 'NOT SET');

const client = twilio(accountSid, authToken);

async function testTwilio() {
  try {
    // Test basic connectivity
    const account = await client.api.accounts(accountSid).fetch();
    console.log('✅ Account connection successful:', account.friendlyName);

    // Test verification service
    const service = await client.verify.v2.services(serviceSid).fetch();
    console.log('✅ Verification service found:', service.friendlyName);

    // Test sending a verification (optional - comment out if you don't want to send test SMS)
    /*
    const verification = await client.verify.v2.services(serviceSid)
      .verifications
      .create({
        to: '+917077404655', // Replace with your test number
        channel: 'sms'
      });
    console.log('✅ Test verification sent, SID:', verification.sid);
    */

    console.log('🎉 All Twilio credentials are working correctly!');

  } catch (error) {
    console.error('❌ Twilio test failed:', error.message);
    if (error.code) {
      console.error('Error code:', error.code);
    }
  }
}

testTwilio();

const twilio = require('twilio');
require('dotenv').config();

const client = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);

async function checkServices() {
  try {
    const services = await client.verify.v2.services.list();
    console.log('Available verification services:');
    services.forEach(service => {
      console.log(`SID: ${service.sid}, Friendly Name: ${service.friendlyName}`);
    });

    if (services.length === 0) {
      console.log('No verification services found. Creating a new one...');
      const newService = await client.verify.v2.services.create({
        friendlyName: 'CerenMobile OTP Service'
      });
      console.log(`New service created with SID: ${newService.sid}`);
      console.log('Please update your .env file with:');
      console.log(`TWILIO_VERIFY_SERVICE_SID=${newService.sid}`);
    }
  } catch (error) {
    console.error('Error:', error.message);
  }
}

checkServices();

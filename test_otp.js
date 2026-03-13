import dotenv from 'dotenv';
import { LiveOTPProvider } from './lib/providers.js';

dotenv.config();

async function test() {
    try {
        console.log('Testing OTP Start...');
        const result = await LiveOTPProvider.start('9988776655', 'phone');
        console.log('Result:', result);
    } catch (err) {
        console.error('Test Failed:', err);
    }
}

test();

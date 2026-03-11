# FOLK — HKM Vizag

Hare Krishna! 🙏 Welcome to the backend repository of the real-time **FOLK Platform** for **Hare Krishna Movement Visakhapatnam (HKM Vizag)** under the lotus feet of Sri Sri Radha Madanmohan.

## Prerequisites
- Node.js 18+
- PostgreSQL
- Redis
- All environment variables filled in `.env` based on `.env.example`.

## Setup
1. `npm install`
2. `cp .env.example .env` and fill all variables.
3. `npx prisma migrate dev --name init`
4. `node seed.js`
5. `npm run dev`

## Deployment
Recommended: Vercel for frontend/Next.js API.
For Node backend (WebSocket + Express): Render or self-hosted Node instance.

## Provider Setup Guides

### 1. Twilio Verify Setup
1. Go to Twilio Console, sign up, and create a project.
2. Navigate to Verify > Services > Create Service.
3. Name it "FOLK" and copy the `Service SID` to `TWILIO_VERIFY_SID`.
4. Copy `Account SID` and `Auth Token` to `.env`.
5. Ensure SMS channel is active.

### 2. Razorpay Live Mode Activation
1. Complete KYC verification on Razorpay Dashboard.
2. Switch to **Live Mode**.
3. Go to Settings > API Keys > Generate Live Key.
4. Copy `Key Id` and `Key Secret` to `.env`.
5. Setup Webhook URL mapping to `/api/webhooks/razorpay`.

### 3. Meta WhatsApp Business API Setup
1. Create a Meta Developer App.
2. Add the WhatsApp product to the app.
3. Add a phone number and complete business verification.
4. Generate a permanent access token via System User.
5. Create template `folk_coupon_issue`.
6. Configure Webhooks to receive message status.
7. Fill `.env` with Token, Phone Number ID, and Business Account ID.

### 4. Cloudflare R2 Bucket Setup
1. In Cloudflare Dashboard, go to R2 > Create bucket.
2. Name it `folk-hkmvizag`.
3. Enable public access via a custom domain.
4. Create R2 API Tokens (Edit permissions).

### 5. Upstash Redis Setup
1. Create an account on Upstash.
2. Create a Redis database (Global/Regional).
3. Copy `REDIS_URL` and `REDIS_TOKEN` to `.env`.

### 6. VAPID Key Generation
1. `npx web-push generate-vapid-keys`
2. Copy `Public Key` to `VAPID_PUBLIC_KEY` and `NEXT_PUBLIC_VAPID_PUBLIC_KEY`.
3. Copy `Private Key` to `VAPID_PRIVATE_KEY`.

All Glories to Srila Prabhupada!
Sri Sri Radha Madanmohan ki Jai!

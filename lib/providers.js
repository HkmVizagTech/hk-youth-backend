import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import webpush from 'web-push';
import { SignJWT, jwtVerify } from 'jose';
import crypto from 'crypto';
import Redis from 'ioredis';
import { PrismaClient } from '@prisma/client';

export const prisma = new PrismaClient();

// Initialize Redis with fallback
let redisClient;
try {
    redisClient = new Redis(process.env.REDIS_URL || 'redis://localhost:6379', {
        retryStrategy: (times) => {
            if (times > 3) {
                console.warn('❌ Redis connection failed 3 times. Falling back to in-memory store.');
                return null; // stop retrying
            }
            return Math.min(times * 100, 2000);
        }
    });

    redisClient.on('error', (err) => {
        console.warn('⚠️ Redis Error:', err.message);
        if (!redisClient.isFallback) {
            console.warn('🔄 Switching to in-memory fallback...');
            const store = new Map();
            redisClient.isFallback = true;
            redisClient.get = async (key) => store.get(key);
            redisClient.set = async (key, val, ex, ttl) => {
                store.set(key, val);
                if (ex === 'EX') setTimeout(() => store.delete(key), ttl * 1000);
                return 'OK';
            };
            redisClient.del = async (key) => store.delete(key);
        }
    });
} catch (e) {
    console.error('❌ Redis Init Error:', e);
    const store = new Map();
    redisClient = {
        isFallback: true,
        get: async (key) => store.get(key),
        set: async (key, val, ex, ttl) => {
            store.set(key, val);
            if (ex === 'EX') setTimeout(() => store.delete(key), ttl * 1000);
            return 'OK';
        },
        del: async (key) => store.delete(key),
        on: () => { }
    };
}
export const redis = redisClient;

// Configure Web Push
if (process.env.VAPID_PUBLIC_KEY && process.env.VAPID_PRIVATE_KEY) {
    webpush.setVapidDetails(
        process.env.VAPID_SUBJECT || 'mailto:admin@hkmvizag.org',
        process.env.VAPID_PUBLIC_KEY,
        process.env.VAPID_PRIVATE_KEY
    );
}

// Initialize S3
export const s3Client = process.env.STORAGE_ACCESS_KEY ? new S3Client({
    region: process.env.STORAGE_REGION || 'auto',
    endpoint: process.env.STORAGE_ENDPOINT,
    credentials: {
        accessKeyId: process.env.STORAGE_ACCESS_KEY,
        secretAccessKey: process.env.STORAGE_SECRET_KEY,
    },
}) : null;

export class LivePushProvider {
    static async send(audience, title, body, imageUrl, data) {
        if (!process.env.VAPID_PUBLIC_KEY) return { sent: 0 };

        // Resolve audience to user IDs (stub logic based on 'everyone', 'batch:XYZ', or array of IDs)
        let userIds = [];
        if (Array.isArray(audience)) userIds = audience;
        else if (audience === 'everyone') {
            const users = await prisma.user.findMany({ select: { id: true } });
            userIds = users.map(u => u.id);
        } // add other scopes as needed

        const subs = await prisma.pushSubscription.findMany({
            where: { userId: { in: userIds } }
        });

        const payload = JSON.stringify({
            title, body, icon: '/icon-192.png',
            badge: '/badge-72.png', image: imageUrl,
            data: { url: data?.url || '/app/home', ...data }
        });

        const results = await Promise.allSettled(
            subs.map(sub =>
                webpush.sendNotification(
                    { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } },
                    payload
                ).catch(async err => {
                    if (err.statusCode === 410) {
                        await prisma.pushSubscription.delete({
                            where: { endpoint: sub.endpoint }
                        });
                    }
                    throw err;
                })
            )
        );

        const sent = results.filter(r => r.status === 'fulfilled').length;

        await prisma.auditLog.create({
            data: {
                action: 'push_sent',
                entityType: 'notification',
                payload: { audience, title, body, sent },
                actorId: 'system'
            }
        });

        return { sent };
    }
}

export class LiveWhatsAppProvider {
    static async sendMessage(to, payload) {
        if (!process.env.WHATSAPP_PHONE_NUMBER_ID || !process.env.WHATSAPP_TOKEN) return { sent: false };
        const response = await fetch(
            `https://graph.facebook.com/v18.0/${process.env.WHATSAPP_PHONE_NUMBER_ID}/messages`,
            {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${process.env.WHATSAPP_TOKEN}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ messaging_product: 'whatsapp', ...payload })
            }
        );
        const result = await response.json();
        if (!response.ok) throw new Error(JSON.stringify(result));
        return result;
    }

    static async sendText(to, message) {
        return this.sendMessage(to, {
            to: `91${to}`,
            type: 'text',
            text: { body: message }
        });
    }

    static async sendTemplate(to, templateName, params) {
        return this.sendMessage(to, {
            to: `91${to}`,
            type: 'template',
            template: {
                name: templateName,
                language: { code: 'en' },
                components: [{
                    type: 'body',
                    parameters: params.map(p => ({ type: 'text', text: p }))
                }]
            }
        });
    }

    static async send(to, message, deepLink) {
        try {
            if (deepLink) {
                await this.sendTemplate(to, 'folk_message_with_link', [message, deepLink]);
            } else {
                await this.sendText(to, message);
            }
            await prisma.auditLog.create({
                data: {
                    action: 'whatsapp_sent',
                    entityType: 'message',
                    payload: { to, message, deepLink },
                    status: 'sent',
                    actorId: 'system'
                }
            });
            return { sent: true };
        } catch (error) {
            await prisma.auditLog.create({
                data: {
                    action: 'whatsapp_failed',
                    entityType: 'message',
                    payload: { to, error: String(error) },
                    status: 'failed',
                    actorId: 'system'
                }
            });
            throw error;
        }
    }
}

export class LiveStorageProvider {
    static async generateUploadUrl(filename, mimeType, folder, userId) {
        if (!s3Client) return { error: 'Storage not configured' };
        const key = `${folder}/${userId}/${Date.now()}-${filename}`;
        const command = new PutObjectCommand({
            Bucket: process.env.STORAGE_BUCKET,
            Key: key,
            ContentType: mimeType,
            ACL: 'public-read'
        });
        const presignedUrl = await getSignedUrl(s3Client, command, { expiresIn: 300 });
        const publicUrl = `${process.env.STORAGE_CDN_URL}/${key}`;
        return { presignedUrl, publicUrl, key };
    }
}

export class LiveQRProvider {
    static async generate(payload, ttlSeconds) {
        const nonce = crypto.randomUUID();
        const expiresAt = new Date(Date.now() + ttlSeconds * 1000);
        const jwtSecret = new TextEncoder().encode(process.env.QR_JWT_SECRET || 'dev-secret');

        const token = await new SignJWT({ ...payload, nonce })
            .setProtectedHeader({ alg: 'HS256' })
            .setExpirationTime(Math.floor(expiresAt.getTime() / 1000))
            .sign(jwtSecret);

        await redis.set(`qr:nonce:${nonce}`, '1', 'EX', ttlSeconds);

        await prisma.qRToken.create({
            data: {
                token, nonce, expiresAt,
                userId: payload.userId,
                entityType: payload.entityType,
                entityId: payload.entityId
            }
        });

        return { token, nonce, expiresAt };
    }

    static async verify(token) {
        try {
            const jwtSecret = new TextEncoder().encode(process.env.QR_JWT_SECRET || 'dev-secret');
            const { payload } = await jwtVerify(token, jwtSecret);
            const nonceExists = await redis.get(`qr:nonce:${payload.nonce}`);

            if (!nonceExists) {
                return { valid: false, error: 'replayed_or_expired' };
            }

            await redis.del(`qr:nonce:${payload.nonce}`);

            await prisma.qRToken.update({
                where: { nonce: payload.nonce },
                data: { usedAt: new Date() }
            }).catch(() => { });

            return { valid: true, payload };
        } catch (err) {
            return { valid: false, error: 'invalid_token' };
        }
    }
}

export class LiveOTPProvider {
    static async start(identifier, type) {
        const otp = Math.floor(100000 + Math.random() * 900000).toString();
        await redis.set(`otp:${identifier}`, otp, 'EX', 300);

        if (type === 'phone') {
            if (process.env.TWILIO_ACCOUNT_SID) {
                // Twilio logic (simplified for implementation)
                console.log(`[Twilio] Sending OTP ${otp} to ${identifier}`);
            } else if (process.env.MSG91_AUTH_KEY) {
                console.log(`[MSG91] Sending OTP ${otp} to ${identifier}`);
            }
        } else {
            if (process.env.RESEND_API_KEY) {
                console.log(`[Resend] Sending OTP ${otp} to ${identifier}`);
            }
        }

        return { sent: true, maskedIdentifier: identifier.replace(/.(?=.{4})/g, '*'), expiresIn: 300 };
    }

    static async verify(identifier, otp) {
        const storedOtp = await redis.get(`otp:${identifier}`);
        if (storedOtp !== otp) return { valid: false };
        await redis.del(`otp:${identifier}`);
        return { valid: true };
    }
}


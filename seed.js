import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
    console.log('🌱 Seeding HKM Vizag FOLK Platform (MongoDB Mode)...');

    // 1. Tenant
    const tenant = await prisma.tenant.create({
        data: {
            name: 'Hare Krishna Movement India'
        }
    });

    // 2. Centers
    const vizagCenter = await prisma.center.create({
        data: {
            tenantId: tenant.id,
            name: 'HKM Visakhapatnam',
            slug: 'hkm-vizag',
            city: 'Visakhapatnam',
            state: 'Andhra Pradesh',
            timezone: 'Asia/Kolkata',
            deityName: 'Sri Sri Radha Madanmohan'
        }
    });

    // 3. Batches
    const batches = [];
    for (let i = 1; i <= 10; i++) {
        const batch = await prisma.batch.create({
            data: {
                name: `FOLK 2026 Batch ${i}`,
                centerId: vizagCenter.id,
            }
        });
        batches.push(batch);
    }

    // 4. Guides
    const guideNames = ['Vaishnava Das', 'Krishna Bhakta Das', 'Govinda Das', 'Madhava Das', 'Bhakti Yoga Das'];
    const guides = [];
    for (const name of guideNames) {
        const user = await prisma.user.create({
            data: {
                displayName: name,
                spiritualName: name,
                phone: `999990000${guides.length}`,
                email: `${name.toLowerCase().replace(/ /g, '.')}@hkmvizag.org`,
                role: 'folk_guide',
                password: "password123",
                centerId: vizagCenter.id
            }
        });
        guides.push(user);

        // Assign guide to a batch
        await prisma.batchGuide.create({
            data: {
                userId: user.id,
                batchId: batches[guides.length - 1].id,
                isLead: true
            }
        });
    }

    // 5. Admin
    const admin = await prisma.user.upsert({
        where: { email: 'admin@hkmvizag.org' },
        update: { password: 'adminpassword' },
        create: {
            displayName: 'Temple Admin',
            spiritualName: 'Admin Das',
            phone: '8888800000',
            email: 'admin@hkmvizag.org',
            role: 'folk_admin',
            password: "adminpassword",
            centerId: vizagCenter.id
        }
    });

    // 6. Users (Members)
    for (let i = 1; i <= 20; i++) {
        await prisma.user.create({
            data: {
                displayName: `Devotee ${i}`,
                phone: `98765432${i.toString().padStart(2, '0')}`,
                email: `devotee${i}@gmail.com`,
                role: 'folk_member',
                password: "password123",
                centerId: vizagCenter.id,
                batchId: batches[i % 10].id
            }
        });
    }

    console.log('✅ Seeded Tenant, Center, Batches, Guides, Admin, Members.');
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });

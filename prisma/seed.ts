import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  // Clear existing
  await prisma.report.deleteMany({});

  console.log("Seeding Lost & Found data...");

  const now = new Date();
  
  // 1. AirPods match scenario
  await prisma.report.create({
    data: {
      type: "LOST",
      title: "Black Apple AirPods Pro charging case",
      category: "Electronics",
      description: "Lost my black charging case for AirPods. It has a small scratch on the front.",
      color: "Black",
      location: "Cafeteria",
      contactEmail: "lost1@example.com",
      eventDate: new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() - 2)),
    }
  });

  await prisma.report.create({
    data: {
      type: "FOUND",
      title: "Dark wireless earbud case",
      category: "Electronics",
      description: "Found near the coffee shop.",
      color: "Dark",
      location: "Cafeteria",
      contactEmail: "found1@example.com",
      imageUrl: "https://res.cloudinary.com/demo/image/upload/v1312461204/sample.jpg",
      eventDate: new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() - 1)),
    }
  });

  // 2. Black laptop vs black backpack (False positive scenario)
  await prisma.report.create({
    data: {
      type: "LOST",
      title: "Black laptop",
      category: "Electronics",
      color: "Black",
      location: "Library",
      contactEmail: "lost2@example.com",
      eventDate: new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() - 1)),
    }
  });

  await prisma.report.create({
    data: {
      type: "FOUND",
      title: "Black backpack",
      category: "Bags",
      color: "Black",
      location: "Library",
      contactEmail: "found2@example.com",
      eventDate: new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() - 1)),
    }
  });

  // 3. Unrelated items
  await prisma.report.create({
    data: {
      type: "LOST",
      title: "Student ID Card",
      category: "Documents",
      description: "John Doe ID card.",
      location: "Engineering Building",
      contactEmail: "lost3@example.com",
      eventDate: new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() - 4)),
    }
  });

  await prisma.report.create({
    data: {
      type: "FOUND",
      title: "Keys",
      category: "Accessories",
      description: "Set of 3 keys on a red lanyard.",
      color: "Silver",
      location: "Gym",
      contactEmail: "found3@example.com",
      eventDate: new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() - 3)),
    }
  });

  await prisma.report.create({
    data: {
      type: "LOST",
      title: "MacBook Charger",
      category: "Electronics",
      color: "White",
      location: "Student Center",
      contactEmail: "lost4@example.com",
      eventDate: new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() - 10)),
    }
  });

  await prisma.report.create({
    data: {
      type: "FOUND",
      title: "Leather Wallet",
      category: "Accessories",
      color: "Brown",
      location: "Quad",
      contactEmail: "found4@example.com",
      eventDate: new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() - 5)),
    }
  });

  console.log("Seeding complete!");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

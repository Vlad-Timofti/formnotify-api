const bcrypt = require("bcrypt");
const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

async function main() {
  const passwordHash = await bcrypt.hash("123456", 10);

  const organization = await prisma.organization.upsert({
    where: {
      slug: "demo-company",
    },
    update: {},
    create: {
      name: "Demo Company",
      slug: "demo-company",
      apiKey: "fn_demo_api_key_change_me",
      plan: "free",
    },
  });

  await prisma.user.upsert({
    where: {
      email: "admin@test.com",
    },
    update: {},
    create: {
      organizationId: organization.id,
      name: "Admin",
      email: "admin@test.com",
      passwordHash,
      role: "owner",
    },
  });

  await prisma.form.create({
    data: {
      organizationId: organization.id,
      title: "Contact Form",
      description: "Demo contact form",
      isActive: true,
      fieldsJson: [
        {
          id: "full_name",
          type: "text",
          label: "Full Name",
          required: true,
        },
        {
          id: "email",
          type: "email",
          label: "Email Address",
          required: true,
        },
        {
          id: "message",
          type: "textarea",
          label: "Message",
          required: false,
        },
      ],
    },
  });

  console.log("Demo data created:");
  console.log("Email: admin@test.com");
  console.log("Password: 123456");
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
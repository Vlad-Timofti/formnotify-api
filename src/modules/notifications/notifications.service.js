const nodemailer = require("nodemailer");
const prisma = require("../../db/prisma");

async function sendWebhookNotification({ channel, form, submission }) {
  const url = channel.configJson.url;

  if (!url) {
    throw new Error("Webhook URL is missing");
  }

  const response = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "User-Agent": "FormNotify/1.0",
    },
    body: JSON.stringify({
      event: "form.submitted",
      form: {
        id: form.id,
        title: form.title,
      },
      submission: {
        id: submission.id,
        data: submission.dataJson,
        createdAt: submission.createdAt,
      },
    }),
  });

  if (!response.ok) {
    throw new Error(`Webhook failed with status ${response.status}`);
  }
}

function createEmailTransporter() {
  if (!process.env.SMTP_HOST || !process.env.SMTP_USER || !process.env.SMTP_PASS) {
    throw new Error("SMTP is not configured");
  }

  return nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT || 587),
    secure: Number(process.env.SMTP_PORT || 587) === 465,
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });
}

function formatSubmissionData(data) {
  return Object.entries(data)
    .map(([key, value]) => `${key}: ${value}`)
    .join("\n");
}

async function sendEmailNotification({ channel, form, submission }) {
  const to = channel.configJson.to;

  if (!to) {
    throw new Error("Email recipient is missing");
  }

  const transporter = createEmailTransporter();

  await transporter.sendMail({
    from: process.env.SMTP_FROM || "FormNotify <no-reply@formnotify.local>",
    to,
    subject: `New submission: ${form.title}`,
    text: `You received a new submission for "${form.title}".\n\n${formatSubmissionData(
      submission.dataJson
    )}\n\nSubmission ID: ${submission.id}`,
  });
}

async function dispatchSubmissionNotifications({ form, submission }) {
  const channels = await prisma.notificationChannel.findMany({
    where: {
      organizationId: form.organizationId,
      isActive: true,
    },
  });

  for (const channel of channels) {
    try {
      if (channel.type === "webhook") {
        await sendWebhookNotification({ channel, form, submission });
      }

      if (channel.type === "email") {
        await sendEmailNotification({ channel, form, submission });
      }

      await prisma.notificationLog.create({
        data: {
          organizationId: form.organizationId,
          submissionId: submission.id,
          notificationChannelId: channel.id,
          status: "sent",
        },
      });
    } catch (error) {
      await prisma.notificationLog.create({
        data: {
          organizationId: form.organizationId,
          submissionId: submission.id,
          notificationChannelId: channel.id,
          status: "failed",
          errorMessage: error.message,
        },
      });
    }
  }
}

module.exports = {
  dispatchSubmissionNotifications,
};
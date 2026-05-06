const express = require("express");

const prisma = require("../../db/prisma");
const authMiddleware = require("../../middleware/authMiddleware");

const { dispatchSubmissionNotifications } = require("../notifications/notifications.service");

const router = express.Router();

function isEmpty(value) {
  return value === undefined || value === null || value === "";
}

function validateSubmission(fields, submittedData) {
  const errors = {};
  const cleanData = {};

  for (const field of fields) {
    const value = submittedData[field.id];

    if (field.required && isEmpty(value)) {
      errors[field.id] = `${field.label} is required`;
      continue;
    }

    if (isEmpty(value)) {
      cleanData[field.id] = value ?? null;
      continue;
    }

    if (field.type === "email") {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

      if (typeof value !== "string" || !emailRegex.test(value)) {
        errors[field.id] = `${field.label} must be a valid email`;
        continue;
      }
    }

    if (field.type === "number") {
      const numberValue = Number(value);

      if (Number.isNaN(numberValue)) {
        errors[field.id] = `${field.label} must be a number`;
        continue;
      }

      cleanData[field.id] = numberValue;
      continue;
    }

    if (field.type === "checkbox") {
      if (typeof value !== "boolean") {
        errors[field.id] = `${field.label} must be true or false`;
        continue;
      }
    }

    if ((field.type === "select" || field.type === "radio") && field.options) {
      if (!field.options.includes(value)) {
        errors[field.id] = `${field.label} has an invalid option`;
        continue;
      }
    }

    cleanData[field.id] = value;
  }

  return {
    valid: Object.keys(errors).length === 0,
    errors,
    cleanData,
  };
}

router.post("/public/forms/:formId/submit", async (req, res) => {
  try {
    const form = await prisma.form.findUnique({
      where: {
        id: req.params.formId,
      },
    });

    if (!form) {
      return res.status(404).json({
        success: false,
        message: "Form not found",
      });
    }

    if (!form.isActive) {
      return res.status(403).json({
        success: false,
        message: "Form is not active",
      });
    }

    const fields = form.fieldsJson;
    const submittedData = req.body || {};

    const result = validateSubmission(fields, submittedData);

    if (!result.valid) {
      return res.status(400).json({
        success: false,
        message: "Validation failed",
        errors: result.errors,
      });
    }

    const submission = await prisma.submission.create({
      data: {
        organizationId: form.organizationId,
        formId: form.id,
        dataJson: result.cleanData,
        ipAddress: req.ip,
        userAgent: req.headers["user-agent"] || null,
      },
    });

    await dispatchSubmissionNotifications({
        form,
        submission,
    });

    return res.status(201).json({
      success: true,
      message: "Submission received",
      submissionId: submission.id,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Failed to submit form",
      error: error.message,
    });
  }
});

router.get("/forms/:formId/submissions", authMiddleware, async (req, res) => {
  const form = await prisma.form.findFirst({
    where: {
      id: req.params.formId,
      organizationId: req.organization.id,
    },
  });

  if (!form) {
    return res.status(404).json({
      success: false,
      message: "Form not found",
    });
  }

  const submissions = await prisma.submission.findMany({
    where: {
      formId: form.id,
      organizationId: req.organization.id,
    },
    orderBy: {
      createdAt: "desc",
    },
  });

  return res.json({
    success: true,
    submissions,
  });
});

router.get("/submissions/:id", authMiddleware, async (req, res) => {
  const submission = await prisma.submission.findFirst({
    where: {
      id: req.params.id,
      organizationId: req.organization.id,
    },
    include: {
      form: true,
      notificationLogs: true,
    },
  });

  if (!submission) {
    return res.status(404).json({
      success: false,
      message: "Submission not found",
    });
  }

  return res.json({
    success: true,
    submission,
  });
});

module.exports = router;
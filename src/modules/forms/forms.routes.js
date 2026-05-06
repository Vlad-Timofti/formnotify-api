const express = require("express");
const { z } = require("zod");

const prisma = require("../../db/prisma");
const authMiddleware = require("../../middleware/authMiddleware");

const router = express.Router();

const fieldSchema = z.object({
  id: z.string().min(1),
  type: z.enum([
    "text",
    "email",
    "number",
    "textarea",
    "select",
    "checkbox",
    "radio",
    "phone",
    "date",
  ]),
  label: z.string().min(1),
  placeholder: z.string().optional(),
  required: z.boolean().optional().default(false),
  options: z.array(z.string()).optional(),
});

const createFormSchema = z.object({
  title: z.string().min(2),
  description: z.string().optional(),
  fields: z.array(fieldSchema).min(1),
  isActive: z.boolean().optional().default(true),
});

const updateFormSchema = createFormSchema.partial();

router.use(authMiddleware);

router.post("/", async (req, res) => {
  try {
    const data = createFormSchema.parse(req.body);

    const form = await prisma.form.create({
      data: {
        organizationId: req.organization.id,
        title: data.title,
        description: data.description || null,
        fieldsJson: data.fields,
        isActive: data.isActive,
      },
    });

    return res.status(201).json({
      success: true,
      form,
    });
  } catch (error) {
    return res.status(400).json({
      success: false,
      message: "Invalid form data",
      error: error.errors || error.message,
    });
  }
});

router.get("/", async (req, res) => {
  const forms = await prisma.form.findMany({
    where: {
      organizationId: req.organization.id,
    },
    orderBy: {
      createdAt: "desc",
    },
  });

  return res.json({
    success: true,
    forms,
  });
});

router.get("/:id", async (req, res) => {
  const form = await prisma.form.findFirst({
    where: {
      id: req.params.id,
      organizationId: req.organization.id,
    },
  });

  if (!form) {
    return res.status(404).json({
      success: false,
      message: "Form not found",
    });
  }

  return res.json({
    success: true,
    form,
  });
});

router.patch("/:id", async (req, res) => {
  try {
    const data = updateFormSchema.parse(req.body);

    const existingForm = await prisma.form.findFirst({
      where: {
        id: req.params.id,
        organizationId: req.organization.id,
      },
    });

    if (!existingForm) {
      return res.status(404).json({
        success: false,
        message: "Form not found",
      });
    }

    const form = await prisma.form.update({
      where: {
        id: existingForm.id,
      },
      data: {
        title: data.title ?? existingForm.title,
        description:
          data.description !== undefined
            ? data.description
            : existingForm.description,
        fieldsJson: data.fields ?? existingForm.fieldsJson,
        isActive:
          data.isActive !== undefined ? data.isActive : existingForm.isActive,
      },
    });

    return res.json({
      success: true,
      form,
    });
  } catch (error) {
    return res.status(400).json({
      success: false,
      message: "Invalid update data",
      error: error.errors || error.message,
    });
  }
});

router.delete("/:id", async (req, res) => {
  const existingForm = await prisma.form.findFirst({
    where: {
      id: req.params.id,
      organizationId: req.organization.id,
    },
  });

  if (!existingForm) {
    return res.status(404).json({
      success: false,
      message: "Form not found",
    });
  }

  await prisma.form.delete({
    where: {
      id: existingForm.id,
    },
  });

  return res.json({
    success: true,
    message: "Form deleted",
  });
});

module.exports = router;
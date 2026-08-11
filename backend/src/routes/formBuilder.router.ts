import { Router, type Request } from "express";
import { z } from "zod";
import { formDefinitionSchema, type BuilderConfig } from "@formbuilder/shared";
import { asyncHandler } from "../utils/asyncHandler";
import { parsePositiveInt } from "../utils/queryParsing";
import { requireAdmin } from "../middleware/authJwt";
import { validateBody } from "../middleware/validate";
import { buildFormVersionPreview, type PreviewVariant } from "../services/previewService";
import {
  buildFormZip,
  createForm,
  deleteForm,
  getFormDetail,
  listForms,
  listFormVersions,
  publishForm,
  unpublishForm,
  updateDraft,
  type ListFormsOptions,
} from "../services/formBuilderService";
import type { FormStatus } from "../entities/Form";

export const formBuilderRouter = Router();

formBuilderRouter.use(requireAdmin);

const FORM_STATUS_VALUES = new Set<FormStatus>(["draft", "published", "unpublished"]);
function isFormStatus(value: unknown): value is FormStatus {
  return typeof value === "string" && FORM_STATUS_VALUES.has(value as FormStatus);
}

function parseListOptions(req: Request): ListFormsOptions {
  return {
    status: isFormStatus(req.query.status) ? req.query.status : undefined,
    subsidiaryId: typeof req.query.subsidiaryId === "string" ? req.query.subsidiaryId : undefined,
    search: typeof req.query.search === "string" ? req.query.search : undefined,
    page: parsePositiveInt(req.query.page),
    pageSize: parsePositiveInt(req.query.pageSize),
  };
}

formBuilderRouter.get(
  "/",
  asyncHandler(async (req, res) => {
    const result = await listForms(parseListOptions(req));
    res.json(result);
  }),
);

const createFormSchema = z.object({
  name: z.string().trim().min(1),
  subsidiaryId: z.string().trim().min(1),
  projectCode: z.string().trim().min(1).optional(),
});

formBuilderRouter.post(
  "/",
  validateBody(createFormSchema),
  asyncHandler(async (req, res) => {
    const { name, subsidiaryId, projectCode } = req.body as z.infer<typeof createFormSchema>;
    const form = await createForm({ name, subsidiaryId, projectCode: projectCode ?? null, userId: req.auth!.sub });
    res.status(201).json(form);
  }),
);

formBuilderRouter.get(
  "/:id",
  asyncHandler(async (req, res) => {
    const detail = await getFormDetail(req.params.id);
    if (!detail) {
      res.status(404).json({ error: "form not found" });
      return;
    }
    res.json(detail);
  }),
);

// Deliberately lenient (not the full formDefinitionZod-style strictness) — a
// BuilderConfig has no dedicated Zod schema in @formbuilder/shared today, and the
// only field this route actually depends on downstream is `variants`; everything
// else just needs to round-trip through JSON.stringify/parse intact.
const builderConfigSchema = z
  .object({
    variants: z.array(z.enum(["ff", "oc"])).min(1),
  })
  .catchall(z.unknown());

const updateDraftSchema = z.object({
  definition: formDefinitionSchema,
  config: builderConfigSchema,
});

formBuilderRouter.patch(
  "/:id/draft",
  validateBody(updateDraftSchema),
  asyncHandler(async (req, res) => {
    const { definition, config } = req.body as z.infer<typeof updateDraftSchema>;
    const outcome = await updateDraft(req.params.id, definition, config as BuilderConfig);
    if (outcome === "not_found") {
      res.status(404).json({ error: "form not found" });
      return;
    }
    res.status(204).send();
  }),
);

formBuilderRouter.post(
  "/:id/publish",
  asyncHandler(async (req, res) => {
    const result = await publishForm(req.params.id, req.auth!.sub);
    if (result.outcome === "not_found") {
      res.status(404).json({ error: "form not found" });
      return;
    }
    if (result.outcome === "invalid") {
      res.status(422).json({ error: "form is not valid", validation: result.validation });
      return;
    }
    res.json({ validation: result.validation });
  }),
);

formBuilderRouter.post(
  "/:id/unpublish",
  asyncHandler(async (req, res) => {
    const outcome = await unpublishForm(req.params.id);
    if (outcome === "not_found") {
      res.status(404).json({ error: "form not found" });
      return;
    }
    if (outcome === "not_published") {
      res.status(409).json({ error: "form is not currently published" });
      return;
    }
    res.status(204).send();
  }),
);

formBuilderRouter.delete(
  "/:id",
  asyncHandler(async (req, res) => {
    const outcome = await deleteForm(req.params.id);
    if (outcome === "not_found") {
      res.status(404).json({ error: "form not found" });
      return;
    }
    res.status(204).send();
  }),
);

formBuilderRouter.get(
  "/:id/versions",
  asyncHandler(async (req, res) => {
    const versions = await listFormVersions(req.params.id);
    res.json(versions);
  }),
);

formBuilderRouter.get(
  "/:id/preview",
  asyncHandler(async (req, res) => {
    const variant: PreviewVariant = req.query.variant === "oc" ? "oc" : "ff";
    const result = await buildFormVersionPreview(req.params.id, variant);
    if (result.outcome === "not_found") {
      res.status(404).json({ error: "form not found or not published" });
      return;
    }
    if (result.outcome === "no_files") {
      res.status(409).json({ error: "this form has no generated files" });
      return;
    }
    res.set("Content-Type", "text/html");
    res.send(result.html);
  }),
);

formBuilderRouter.get(
  "/:id/download",
  asyncHandler(async (req, res) => {
    const result = await buildFormZip(req.params.id);
    if (result.outcome === "not_found") {
      res.status(404).json({ error: "form not found" });
      return;
    }
    if (result.outcome === "unpublished" || result.outcome === "no_files") {
      res.status(409).json({ error: "this form has no published generated files" });
      return;
    }
    res.set("Content-Type", "application/zip");
    res.set("Content-Disposition", `attachment; filename="${result.fileName}"`);
    res.send(Buffer.from(result.buffer!));
  }),
);

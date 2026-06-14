// @ts-nocheck
import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { generateDocxFromTemplate, type PlaceholderData } from "@/lib/docx-engine.server";
import { supabaseAdmin } from "@/integrations/supabase/client.server";

export const generateDocxFn = createServerFn({ method: "POST" })
  .inputValidator(
    z.object({
      templatePath: z.string(),
      data: z.record(z.union([z.string(), z.number()])),
      tenantId: z.string(),
      fileName: z.string().optional(),
    })
  )
  .handler(async ({ data }) => {
    const buffer = await generateDocxFromTemplate(data.templatePath, data.data as PlaceholderData);

    // Upload generated DOCX to storage
    const outputName = data.fileName ?? "generated.docx";
    const outputPath = `generated/${data.tenantId}/${Date.now()}_${outputName}`;
    await supabaseAdmin.storage.from("templates").upload(outputPath, buffer, {
      contentType: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      upsert: true,
    });

    // Return signed URL
    const { data: signed } = await supabaseAdmin.storage.from("templates").createSignedUrl(outputPath, 600);
    return { url: signed?.signedUrl ?? "", path: outputPath };
  });

export const getTemplateDefaultFn = createServerFn({ method: "GET" })
  .inputValidator(z.object({ tenantId: z.string(), category: z.enum(["invoice", "receipt", "letter"]) }))
  .handler(async ({ data }) => {
    const { data: tmpl, error } = await supabaseAdmin
      .from("templates")
      .select("*")
      .eq("tenant_id", data.tenantId)
      .eq("category", data.category)
      .eq("is_default", true)
      .eq("is_active", true)
      .single();
    if (error || !tmpl) return null;
    return tmpl;
  });

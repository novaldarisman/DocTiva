-- ====================================================================
-- CENTRALIZED TEMPLATE MANAGEMENT
-- DocTiva Smart Digital Administration
-- ====================================================================

-- 1. Template type enum
CREATE TYPE public.template_category AS ENUM ('invoice', 'receipt', 'letter');

-- 2. Templates table
CREATE TABLE public.templates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  category public.template_category NOT NULL,
  name text NOT NULL,
  description text,
  file_path text NOT NULL,
  file_name text NOT NULL,
  file_size int,
  is_active boolean NOT NULL DEFAULT true,
  is_default boolean NOT NULL DEFAULT false,
  version int NOT NULL DEFAULT 1,
  placeholders text[] DEFAULT '{}',
  uploaded_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  uploaded_by_email text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.templates TO authenticated;
GRANT ALL ON public.templates TO service_role;
ALTER TABLE public.templates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Tenant view templates" ON public.templates FOR SELECT TO authenticated
  USING (tenant_id = public.get_my_tenant_id() OR public.is_platform_admin());
CREATE POLICY "Tenant insert templates" ON public.templates FOR INSERT TO authenticated
  WITH CHECK (tenant_id = public.get_my_tenant_id() OR public.is_platform_admin());
CREATE POLICY "Tenant update templates" ON public.templates FOR UPDATE TO authenticated
  USING (tenant_id = public.get_my_tenant_id() OR public.is_platform_admin());
CREATE POLICY "Tenant delete templates" ON public.templates FOR DELETE TO authenticated
  USING (tenant_id = public.get_my_tenant_id() OR public.is_platform_admin());

CREATE TRIGGER trg_templates_updated BEFORE UPDATE ON public.templates
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 3. Template versions
CREATE TABLE public.template_versions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  template_id uuid NOT NULL REFERENCES public.templates(id) ON DELETE CASCADE,
  version int NOT NULL,
  file_path text NOT NULL,
  file_name text NOT NULL,
  file_size int,
  placeholders text[] DEFAULT '{}',
  changed_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  changed_by_email text,
  created_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT ON public.template_versions TO authenticated;
GRANT ALL ON public.template_versions TO service_role;
ALTER TABLE public.template_versions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Tenant view template versions" ON public.template_versions FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM public.templates t WHERE t.id = template_id AND (t.tenant_id = public.get_my_tenant_id() OR public.is_platform_admin())));

-- 4. Indexes
CREATE INDEX idx_templates_tenant ON public.templates(tenant_id);
CREATE INDEX idx_templates_category ON public.templates(category);
CREATE INDEX idx_templates_default ON public.templates(tenant_id, category) WHERE is_default = true;
CREATE INDEX idx_template_versions_template ON public.template_versions(template_id);

-- 5. Ensure single default template per tenant per category
CREATE OR REPLACE FUNCTION public.enforce_single_default_template()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.is_default THEN
    UPDATE public.templates
    SET is_default = false
    WHERE tenant_id = NEW.tenant_id
      AND category = NEW.category
      AND id != NEW.id
      AND is_default = true;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_single_default_template ON public.templates;
CREATE TRIGGER trg_single_default_template
  BEFORE INSERT OR UPDATE ON public.templates
  FOR EACH ROW WHEN (NEW.is_default = true)
  EXECUTE FUNCTION public.enforce_single_default_template();

-- 6. Storage bucket for templates
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES ('templates', 'templates', false, 10485760, ARRAY['application/vnd.openxmlformats-officedocument.wordprocessingml.document'])
ON CONFLICT (id) DO NOTHING;

-- Storage policies for templates bucket
CREATE POLICY "Tenant read templates storage" ON storage.objects FOR SELECT TO authenticated
  USING (bucket_id = 'templates');
CREATE POLICY "Tenant insert templates storage" ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'templates');
CREATE POLICY "Tenant update templates storage" ON storage.objects FOR UPDATE TO authenticated
  USING (bucket_id = 'templates');
CREATE POLICY "Tenant delete templates storage" ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id = 'templates');


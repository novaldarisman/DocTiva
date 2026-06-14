import { createFileRoute } from "@tanstack/react-router";
import { redirect } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/")({
  beforeLoad: async () => {
    const { data } = await supabase.auth.getSession();
    if (data.session) {
      const { data: roles } = await supabase.from("user_roles").select("role").eq("user_id", data.session.user.id);
      const isPlatformAdmin = (roles ?? []).some((r: any) => r.role === "platform_super_admin");
      throw redirect({ to: isPlatformAdmin ? "/platform" : "/dashboard" });
    }
    throw redirect({ to: "/auth" });
  },
});
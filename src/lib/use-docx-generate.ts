import { useServerFn } from "@tanstack/react-start";
import { generateDocxFn } from "@/lib/api/docx.functions";
import { toast } from "sonner";

export function useDocxGenerate() {
  const generate = useServerFn(generateDocxFn);

  const generateAndDownload = async (params: {
    templatePath: string;
    data: Record<string, string | number>;
    tenantId: string;
    fileName: string;
  }) => {
    try {
      const result = await generate({ data: params });
      if (result?.url) {
        window.open(result.url, "_blank");
        return result.url;
      }
      return null;
    } catch (e) {
      toast.error("Gagal generate DOCX: " + (e as Error).message);
      return null;
    }
  };

  return { generateAndDownload };
}

// @ts-nocheck
import { useState, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useTenantId } from "@/lib/use-tenant-id";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Upload, Download, Trash2, Pencil, Loader2, FileText, Star, Copy, CheckCircle2 } from "lucide-react";
import { useDocxGenerate } from "@/lib/use-docx-generate";
import { toast } from "sonner";


const CATEGORIES = [
  { value: "invoice", label: "Template Invoice", icon: FileText },
  { value: "receipt", label: "Template Kwitansi", icon: FileText },
  { value: "letter", label: "Template Surat Menyurat", icon: FileText },
] as const;

type Template = {
  id: string; name: string; description?: string; category: string;
  file_path: string; file_name: string; file_size?: number;
  is_active: boolean; is_default: boolean; version: number;
  uploaded_by_email?: string; created_at: string;
};

export function TemplateTab() {
  const qc = useQueryClient();
  const tenantId = useTenantId();
  const fileRef = useRef<HTMLInputElement>(null);
  const [tab, setTab] = useState("invoice");
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Template | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [desc, setDesc] = useState("");
  const [isDefault, setIsDefault] = useState(false);
  const [uploading, setUploading] = useState(false);

  const { data: templates, isLoading } = useQuery({
    queryKey: ["templates", tenantId],
    queryFn: async () => {
      const { data, error } = await supabase.from("templates" as any)
        .select("*").eq("tenant_id", tenantId).order("created_at", { ascending: false });
      if (error) throw error;
      return data as Template[];
    },
    enabled: !!tenantId,
  });

  const filtered = (templates ?? []).filter((t: Template) => t.category === tab);

  const resetForm = () => { setName(""); setDesc(""); setIsDefault(false); };

  const openCreate = () => { resetForm(); setEditing(null); setOpen(true); };
  const openEdit = (t: Template) => {
    setEditing(t); setName(t.name); setDesc(t.description ?? ""); setIsDefault(t.is_default); setOpen(true);
  };

  const saveMutation = useMutation({
    mutationFn: async () => {
      if (!name.trim()) throw new Error("Nama template wajib diisi");
      if (!editing && !fileRef.current?.files?.[0]) throw new Error("Pilih file DOCX");
      let filePath = editing?.file_path;
      let fileName = editing?.file_name ?? "";
      let fileSize = editing?.file_size ?? 0;

      if (!editing || fileRef.current?.files?.[0]) {
        const file = fileRef.current!.files![0];
        fileName = file.name;
        fileSize = file.size;
        const path = 	emplates///_;
        setUploading(true);
        const { error: upErr } = await supabase.storage.from("templates").upload(path, file);
        setUploading(false);
        if (upErr) throw upErr;
        filePath = path;
      }

      if (editing) {
        const updates: any = { name, description: desc || null, is_default: isDefault };
        if (filePath !== editing.file_path) {
          updates.file_path = filePath;
          updates.file_name = fileName;
          updates.file_size = fileSize;
          updates.version = editing.version + 1;
        }
        await ((supabase.from("templates") as any)).update(updates).eq("id", editing.id);
        if (updates.version) {
          await ((supabase.from("template_versions") as any) as any).insert({
            template_id: editing.id, version: updates.version,
            file_path: updates.file_path, file_name: updates.file_name, file_size: updates.file_size,
          });
        }
      } else {
        await ((supabase.from("templates") as any)).insert({
          tenant_id: tenantId, category: tab, name, description: desc || null,
          file_path: filePath, file_name: fileName, file_size: fileSize,
          is_default: isDefault, version: 1, is_active: true,
        });
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["templates"] });
      toast.success(editing ? "Template diperbarui" : "Template diupload");
      setOpen(false); resetForm();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const toggleMutation = useMutation({
    mutationFn: async (t: Template) => {
      await ((supabase.from("templates") as any)).update({ is_active: !t.is_active }).eq("id", t.id);
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["templates"] }); },
  });

  const setDefaultMutation = useMutation({
    mutationFn: async (t: Template) => {
      await ((supabase.from("templates") as any)).update({ is_default: false }).eq("tenant_id", tenantId).eq("category", tab);
      await ((supabase.from("templates") as any)).update({ is_default: true }).eq("id", t.id);
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["templates"] }); toast.success("Template default diubah"); },
  });

  const deleteMutation = useMutation({
    mutationFn: async () => {
      if (!deleteId) return;
      await ((supabase.from("templates") as any)).delete().eq("id", deleteId);
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["templates"] }); setDeleteId(null); toast.success("Template dihapus"); },
  });

  const downloadTemplate = async (t: Template) => {
    const { data } = await supabase.storage.from("templates").download(t.file_path);
    if (!data) return toast.error("Gagal download");
    const url = URL.createObjectURL(data);
    const a = document.createElement("a"); a.href = url; a.download = t.file_name;
    document.body.appendChild(a); a.click(); document.body.removeChild(a); URL.revokeObjectURL(url);
  };

  const duplicateTemplate = async (t: Template) => {
    const { data: blob } = await supabase.storage.from("templates").download(t.file_path);
    if (!blob) return toast.error("Gagal duplikasi");
    const path = 	emplates///_copy_;
    const { error } = await supabase.storage.from("templates").upload(path, blob);
    if (error) return toast.error("Gagal duplikasi");
    await ((supabase.from("templates") as any)).insert({
      tenant_id: tenantId, category: tab, name: t.name + " (Copy)",
      file_path: path, file_name: t.file_name, file_size: t.file_size,
      version: 1, is_active: true,
    });
    qc.invalidateQueries({ queryKey: ["templates"] }); toast.success("Template diduplikasi");
  };

  const PLACEHOLDER_LIST = [
    "nomor_dokumen", "tanggal", "nama_perusahaan", "alamat_perusahaan",
    "nama_pelanggan", "nama_pic", "jabatan_pic", "nominal",
    "terbilang", "tanggal_jatuh_tempo", "catatan",
  ];

  return (
    <div className="space-y-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h2 className="font-semibold text-lg">Template Management</h2>
          <p className="text-sm text-muted-foreground">Upload DOCX template — digunakan untuk generate Invoice, Kwitansi, dan Surat</p>
        </div>
        <Button onClick={openCreate}><Upload className="h-4 w-4 mr-2" />Upload Template</Button>
      </div>

      <Tabs value={tab} onValueChange={setTab}>
        <TabsList>
          {CATEGORIES.map((c) => (
            <TabsTrigger key={c.value} value={c.value}>
              <c.icon className="h-3 w-3 mr-1" /> {c.label}
            </TabsTrigger>
          ))}
        </TabsList>

        {CATEGORIES.map((c) => (
          <TabsContent key={c.value} value={c.value} className="space-y-4 pt-4">
            <Card className="overflow-hidden">
              {isLoading ? (
                <div className="p-12 flex justify-center"><Loader2 className="h-6 w-6 animate-spin" /></div>
              ) : filtered.length === 0 ? (
                <div className="p-12 text-center text-muted-foreground">
                  <FileText className="mx-auto h-8 w-8 mb-2 opacity-30" />
                  <p>Belum ada template. Upload template DOCX pertama Anda.</p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Nama Template</TableHead>
                      <TableHead>Versi</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Default</TableHead>
                      <TableHead className="w-[180px]">Aksi</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filtered.map((t: Template) => (
                      <TableRow key={t.id}>
                        <TableCell>
                          <div><span className="font-medium text-sm">{t.name}</span></div>
                          <div className="text-xs text-muted-foreground">{t.file_name}</div>
                        </TableCell>
                        <TableCell className="text-sm">v{t.version}</TableCell>
                        <TableCell>
                          <Badge className={"text-xs " + (t.is_active ? "bg-emerald-100 text-emerald-700" : "bg-muted text-muted-foreground")}>
                            {t.is_active ? "Aktif" : "Nonaktif"}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {t.is_default ? <Star className="h-4 w-4 text-amber-500" /> : "-"}
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-1">
                            <Button variant="ghost" size="icon" title="Generate DOCX" onClick={() => generateAndDownload({ templatePath: t.file_path, data: { nomor_dokumen: "DOC-001", tanggal: new Date().toLocaleDateString("id-ID"), nama_perusahaan: "Nama Perusahaan", alamat_perusahaan: "Alamat", nama_pelanggan: "Nama Pelanggan", nama_pic: "PIC", jabatan_pic: "Jabatan", nominal: 0, terbilang: "-", catatan: "", subtotal: 0, diskon: 0, pajak: 0, tanggal_jatuh_tempo: "-", diterima_dari: "-", untuk_pembayaran: "-", metode: "-", penerima: "-", judul: "Judul", alamat_pelanggan: "-", konten: "Konten" }, tenantId: tenantId!, fileName: t.file_name.replace(".docx", "_generated.docx") })}>
              <FileText className="h-3 w-3" />
            </Button>
            <Button variant="ghost" size="icon" title="Download" onClick={() => downloadTemplate(t)}>
                              <Download className="h-3 w-3" />
                            </Button>
                            <Button variant="ghost" size="icon" title="Set Default" onClick={() => setDefaultMutation.mutate(t)} disabled={t.is_default}>
                              <Star className={"h-3 w-3 " + (t.is_default ? "text-amber-500" : "")} />
                            </Button>
                            <Button variant="ghost" size="icon" title="Duplikasi" onClick={() => duplicateTemplate(t)}>
                              <Copy className="h-3 w-3" />
                            </Button>
                            <Button variant="ghost" size="icon" title="Edit" onClick={() => openEdit(t)}>
                              <Pencil className="h-3 w-3" />
                            </Button>
                            <Button variant="ghost" size="icon" title="Hapus" onClick={() => setDeleteId(t.id)}>
                              <Trash2 className="h-3 w-3 text-destructive" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </Card>

            {/* Placeholder reference */}
            <Card className="p-4">
              <p className="text-sm font-medium mb-2">Placeholder yang didukung:</p>
              <div className="flex flex-wrap gap-1">
                {PLACEHOLDER_LIST.map((p) => (
                  <Badge key={p} variant="outline" className="text-xs font-mono">{"{{" + p + "}}"}</Badge>
                ))}
              </div>
              <p className="text-xs text-muted-foreground mt-2">Gunakan placeholder di dalam DOCX untuk data dinamis.</p>
            </Card>
          </TabsContent>
        ))}
      </Tabs>

      {/* Upload/Edit Dialog */}
      <Dialog open={open} onOpenChange={(o) => { if (!o) setOpen(false); }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editing ? "Edit Template" : "Upload Template Baru"}</DialogTitle>
            <DialogDescription>{editing ? "Perbarui informasi template" : "Upload file DOCX untuk template " + CATEGORIES.find(c => c.value === tab)?.label}</DialogDescription>
          </DialogHeader>
          <form onSubmit={(e) => { e.preventDefault(); saveMutation.mutate(); }} className="space-y-4">
            <div><Label>Nama Template *</Label>
              <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Contoh: Invoice Standar" required /></div>
            <div><Label>Deskripsi</Label>
              <Textarea value={desc} onChange={(e) => setDesc(e.target.value)} placeholder="Deskripsi singkat (opsional)" /></div>
            {!editing && (
              <div><Label>File DOCX *</Label>
                <input ref={fileRef} type="file" accept=".docx" className="block w-full text-sm border rounded-md p-2" required /></div>
            )}
            {editing && (
              <div><Label>Ganti File (opsional)</Label>
                <input ref={fileRef} type="file" accept=".docx" className="block w-full text-sm border rounded-md p-2" />
                <p className="text-xs text-muted-foreground">Biarkan kosong jika tidak ingin mengganti file. Upload file baru akan membuat versi baru.</p></div>
            )}
            <div className="flex items-center gap-2">
              <Checkbox checked={isDefault} onCheckedChange={(v) => setIsDefault(!!v)} />
              <Label>Jadikan template default</Label>
            </div>
            <DialogFooter>
              <Button variant="outline" type="button" onClick={() => setOpen(false)}>Batal</Button>
              <Button type="submit" disabled={saveMutation.isPending || uploading}>
                {(saveMutation.isPending || uploading) && <Loader2 className="h-4 w-4 mr-1 animate-spin" />}
                {editing ? "Simpan" : "Upload"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteId} onOpenChange={(o) => { if (!o) setDeleteId(null); }}>
        <AlertDialogContent>
          <AlertDialogHeader><AlertDialogTitle>Hapus Template?</AlertDialogTitle></AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Batal</AlertDialogCancel>
            <AlertDialogAction onClick={() => deleteMutation.mutate()} className="bg-destructive">Hapus</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
// @ts-nocheck
import PizZip from "pizzip";
import Docxtemplater from "docxtemplater";
import { supabaseAdmin } from "@/integrations/supabase/client.server";

export type PlaceholderData = Record<string, string | number>;

/**
 * Download DOCX template from storage, replace placeholders, return generated DOCX buffer.
 */
export async function generateDocxFromTemplate(
  templatePath: string,
  data: PlaceholderData
): Promise<Buffer> {
  // 1. Download template from Supabase storage
  const { data: blob, error } = await supabaseAdmin.storage
    .from("templates")
    .download(templatePath);

  if (error || !blob) {
    throw new Error("Gagal download template: " + (error?.message ?? "file not found"));
  }

  // 2. Load into docxtemplater
  const buffer = Buffer.from(await blob.arrayBuffer());
  const zip = new PizZip(buffer);

  const doc = new Docxtemplater(zip, {
    paragraphLoop: true,
    linebreaks: true,
    nullGetter: () => "",
  });

  // 3. Set data
  doc.setData(data);

  // 4. Render
  try {
    doc.render();
  } catch (e: any) {
    throw new Error("Gagal render template: " + (e.message ?? String(e)));
  }

  // 5. Generate output buffer
  const out = doc.getZip().generate({
    type: "nodebuffer",
    compression: "DEFLATE",
  });

  return out as Buffer;
}

/**
 * Simple text replacement for non-DOCX content (HTML/text templates).
 */
export function replacePlaceholders(
  content: string,
  data: PlaceholderData
): string {
  return content.replace(/\{\{(\w+)\}\}/g, (_, key) => {
    return String(data[key] ?? "");
  });
}

/**
 * Standard placeholder data for invoice.
 */
export function buildInvoicePlaceholderData(params: {
  nomor_dokumen: string;
  tanggal: string;
  tanggal_jatuh_tempo: string;
  nama_perusahaan: string;
  alamat_perusahaan: string;
  nama_pelanggan: string;
  nama_pic: string;
  jabatan_pic: string;
  nominal: number;
  terbilang: string;
  catatan: string;
  subtotal: number;
  diskon: number;
  pajak: number;
}): PlaceholderData {
  const fmt = (n: number) => "Rp " + new Intl.NumberFormat("id-ID").format(Math.round(n));
  return {
    nomor_dokumen: params.nomor_dokumen,
    tanggal: params.tanggal,
    tanggal_jatuh_tempo: params.tanggal_jatuh_tempo,
    nama_perusahaan: params.nama_perusahaan,
    alamat_perusahaan: params.alamat_perusahaan,
    nama_pelanggan: params.nama_pelanggan,
    nama_pic: params.nama_pic,
    jabatan_pic: params.jabatan_pic,
    nominal: fmt(params.nominal),
    terbilang: params.terbilang,
    catatan: params.catatan,
    subtotal: fmt(params.subtotal),
    diskon: fmt(params.diskon),
    pajak: fmt(params.pajak),
  };
}

/**
 * Standard placeholder data for receipt/kwitansi.
 */
export function buildReceiptPlaceholderData(params: {
  nomor_dokumen: string;
  tanggal: string;
  nama_perusahaan: string;
  alamat_perusahaan: string;
  diterima_dari: string;
  nominal: number;
  terbilang: string;
  untuk_pembayaran: string;
  metode: string;
  penerima: string;
}): PlaceholderData {
  const fmt = (n: number) => "Rp " + new Intl.NumberFormat("id-ID").format(Math.round(n));
  return {
    nomor_dokumen: params.nomor_dokumen,
    tanggal: params.tanggal,
    nama_perusahaan: params.nama_perusahaan,
    alamat_perusahaan: params.alamat_perusahaan,
    diterima_dari: params.diterima_dari,
    nominal: fmt(params.nominal),
    terbilang: params.terbilang,
    untuk_pembayaran: params.untuk_pembayaran,
    metode: params.metode,
    penerima: params.penerima,
  };
}

/**
 * Standard placeholder data for letter/surat.
 */
export function buildLetterPlaceholderData(params: {
  nomor_dokumen: string;
  tanggal: string;
  judul: string;
  nama_perusahaan: string;
  alamat_perusahaan: string;
  nama_pelanggan: string;
  alamat_pelanggan: string;
  nama_pic: string;
  jabatan_pic: string;
  konten: string;
}): PlaceholderData {
  return {
    nomor_dokumen: params.nomor_dokumen,
    tanggal: params.tanggal,
    judul: params.judul,
    nama_perusahaan: params.nama_perusahaan,
    alamat_perusahaan: params.alamat_perusahaan,
    nama_pelanggan: params.nama_pelanggan,
    alamat_pelanggan: params.alamat_pelanggan,
    nama_pic: params.nama_pic,
    jabatan_pic: params.jabatan_pic,
    konten: params.konten,
  };
}
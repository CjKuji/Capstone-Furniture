import { supabase } from "@/lib/supabase";

export async function uploadFile(
  bucket: string,
  folder: string,
  file: File
): Promise<string> {
  const fileName = `${Date.now()}-${crypto.randomUUID()}-${file.name}`;
  const filePath = folder ? `${folder}/${fileName}` : fileName;

  const { data, error } = await supabase.storage
    .from(bucket)
    .upload(filePath, file);

  if (error) throw error;

  const { data: publicUrl } = supabase.storage
    .from(bucket)
    .getPublicUrl(data.path);

  return publicUrl.publicUrl;
}
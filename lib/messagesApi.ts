import { supabase } from './supabaseClient';
import { Message } from './parser';

export async function saveMessages(messages: Message[]) {
  const { error } = await supabase.from("messages").upsert(messages);

  if (error) {
    console.error("Error al guardar:", error);
  } else {
    console.log(`✅ ${messages.length} mensajes guardados correctamente.`);
  }
}

export async function updateMessage(id: string | undefined, fields: Partial<Message>) {
  if (!id) return;
  const { error } = await supabase
    .from('messages')
    .update(fields)
    .eq('id', id);
  if (error) console.error('Error al actualizar:', error);
}

export async function loadMessagesByDate(date: string): Promise<Message[]> {
  const { data, error } = await supabase
    .from('messages')
    .select('*')
    .eq('date', date)
    .order('id', { ascending: true });

  if (error) {
    console.error('❌ Error al cargar mensajes:', error);
    return [];
  }

  return data as Message[];
}
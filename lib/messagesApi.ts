import { supabase } from './supabaseClient';
import { Message } from './parser';

export async function saveMessages(messages: Message[]) {
  const valid = messages.filter(
    (m) => m.date && !m.date.includes("00") && m.nombre && m.telefono
  );

  const { error } = await supabase.from("messages").insert(valid);

  if (error) {
    console.error("Error al guardar:", error);
  } else {
    console.log(`✅ ${valid.length} mensajes guardados correctamente.`);
  }
}

export async function updateMessage(id: string, fields: Partial<Message>) {
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
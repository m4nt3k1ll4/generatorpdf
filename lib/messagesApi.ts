import { supabase } from './supabaseClient';
import { Message } from './parser';

export async function saveMessages(messages: Message[]) {
  const { error } = await supabase.from('messages').insert(messages);
  if (error) console.error('Error al guardar:', error);
}

export async function updateMessage(id: string, fields: Partial<Message>) {
  const { error } = await supabase
    .from('messages')
    .update(fields)
    .eq('id', id);
  if (error) console.error('Error al actualizar:', error);
}

import { supabase } from './supabase'

export async function searchMentionUsers(query) {
  if (!query) return []
  const { data } = await supabase
    .from('profiles')
    .select('username, nickname, avatar_url')
    .or(`username.ilike.${query}%,nickname.ilike.${query}%`)
    .limit(5)
  return data || []
}

export async function sendMentionNotifs(text, postId, commentId, actorId) {
  if (!actorId) return
  const plain = text.replace(/<[^>]+>/g, ' ')
  const matches = plain.match(/@([a-zA-Z0-9_]+)/g) || []
  const usernames = [...new Set(matches.map(m => m.slice(1)))]
  if (!usernames.length) return
  const { data: profiles } = await supabase.from('profiles').select('id').in('username', usernames)
  if (!profiles?.length) return
  const notifs = profiles
    .filter(p => p.id !== actorId)
    .map(p => ({ user_id: p.id, actor_id: actorId, type: 'mention', post_id: postId, comment_id: commentId || null }))
  if (notifs.length) await supabase.from('notifications').insert(notifs)
}

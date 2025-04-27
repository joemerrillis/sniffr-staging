/**
 * Interact with Supabase 'users' table
 */
export async function findUserByEmail(fastify, email) {
  const { data, error } = await fastify.supabase
    .from('users')
    .select('*')
    .eq('email', email)
    .single();
  if (error) throw new Error(error.message);
  return data;
}

export async function createUser(fastify, { email, name, role, passwordHash }) {
  const { data, error } = await fastify.supabase
    .from('users')
    .insert({ email, name, role, password_hash: passwordHash })
    .single();
  if (error) throw new Error(error.message);
  return data;
}

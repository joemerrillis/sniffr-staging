export async function deleteWalkReportController(request, reply) {
  const supabase = request.server.supabase;
  try {
    const id = request.params.id;

    // Perform the deletion and get back the deleted row(s)
    const { data, error } = await supabase
      .from('walk_reports')
      .delete()
      .eq('id', id)
      .select();

    console.log('[walk_reports] Delete result:', { data, error });

    if (error) {
      return reply.code(500).send({ error: error.message });
    }
    // If no rows were deleted, data will be empty array
    if (!data || data.length === 0) {
      return reply.code(404).send({ error: 'Walk report not found.' });
    }
    return reply.send({ deleted: true });
  } catch (error) {
    return reply.code(500).send({ error: error.message });
  }
}

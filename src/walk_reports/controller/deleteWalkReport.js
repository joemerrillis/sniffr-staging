export async function deleteWalkReportController(request, reply) {
  const { supabase } = request;
  try {
    const id = request.params.id;

    // Attempt to delete the walk report by id
    const { error, count } = await supabase
      .from('walk_reports')
      .delete()
      .eq('id', id)
      .select('id', { count: 'exact', head: true });

    if (error) {
      return reply.code(500).send({ error: error.message });
    }
    // If no rows were deleted, report 404
    if (count === 0) {
      return reply.code(404).send({ error: 'Walk report not found.' });
    }
    return reply.send({ deleted: true });
  } catch (error) {
    return reply.code(500).send({ error: error.message });
  }
}

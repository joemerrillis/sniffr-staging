// walk_reports/services/walkReportsService.js

const walkReportsService = {
  async getReportById(supabase, reportId) {
    const { data, error } = await supabase
      .from('walk_reports')
      .select('*')
      .eq('id', reportId)
      .single();
    if (error) throw error;
    return data;
  },

  async updateReport(supabase, reportId, updates) {
    const { data, error } = await supabase
      .from('walk_reports')
      .update(updates)
      .eq('id', reportId)
      .select('*')
      .single();
    if (error) throw error;
    return data;
  },

  async getDogMemoryById(supabase, memoryId) {
    const { data, error } = await supabase
      .from('dog_memories')
      .select('*')
      .eq('id', memoryId)
      .single();
    if (error) return null;
    return data;
  },
};

export default walkReportsService;

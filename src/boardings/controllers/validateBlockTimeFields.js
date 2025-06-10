export default function validateBlockTimeFields(tenant, body) {
  const {
    drop_off_block, pick_up_block,
    drop_off_time, pick_up_time
  } = body;

  if (tenant.use_time_blocks) {
    if (!drop_off_block || !pick_up_block) {
      return 'This tenant requires drop_off_block and pick_up_block.';
    }
    if (tenant.time_blocks_config && Array.isArray(tenant.time_blocks_config)) {
      const allowedBlocks = tenant.time_blocks_config;
      if (!allowedBlocks.includes(drop_off_block) || !allowedBlocks.includes(pick_up_block)) {
        return `Block values must be one of: ${allowedBlocks.join(', ')}`;
      }
    }
  } else {
    if (!drop_off_time || !pick_up_time) {
      return 'This tenant requires drop_off_time and pick_up_time.';
    }
  }
  return null;
}

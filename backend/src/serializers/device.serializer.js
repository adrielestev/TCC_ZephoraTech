export function deviceView({ config_json, state_labels_json, ...device }) {
  return {
    ...device,
    config: config_json ? JSON.parse(config_json) : {},
    state_labels: state_labels_json ? JSON.parse(state_labels_json) : {},
  };
}

export function deviceOperatorView({ id, room_id, name, direction, type, value_unit, current_state, desired_state, state_labels_json, updated_at, automation_lock }) {
  return {
    id, room_id, name, direction, type, value_unit, current_state, desired_state,
    state_labels: state_labels_json ? JSON.parse(state_labels_json) : {}, updated_at,
    automation_lock: automation_lock ?? null,
  };
}

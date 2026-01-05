export function parseFollowers(json) {
  return json
    .map(item => item.string_list_data?.[0]?.value)
    .filter(Boolean);
}

export function parseFollowing(json) {
  return json.relationships_following
    .map(item => item.string_list_data?.[0]?.value)
    .filter(Boolean);
}

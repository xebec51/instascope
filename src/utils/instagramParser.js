export function parseFollowers(json) {
  return json.map(item => {
    return item.string_list_data?.[0]?.value;
  }).filter(Boolean);
}

export function parseFollowing(json) {
  return json.relationships_following.map(item => {
    return item.string_list_data?.[0]?.value;
  }).filter(Boolean);
}

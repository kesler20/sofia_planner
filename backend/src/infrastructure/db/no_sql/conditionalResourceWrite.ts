// Redis compares decoded values so JSON object key order does not cause conflicts.
export const conditionalResourceWrite = `
local function equal(a, b)
  if type(a) ~= type(b) then return false end
  if type(a) ~= 'table' then return a == b end
  for k, v in pairs(a) do if not equal(v, b[k]) then return false end end
  for k, _ in pairs(b) do if a[k] == nil then return false end end
  return true
end
local expected = cjson.decode(ARGV[1])
if expected == cjson.null then
  if redis.call('EXISTS', KEYS[1]) ~= 0 then return 0 end
else
  if redis.call('EXISTS', KEYS[1]) == 0 then return 0 end
  local count = 0
  for field, value in pairs(expected) do
    count = count + 1
    local stored = redis.call('HGET', KEYS[1], field)
    if not stored or not equal(cjson.decode(stored), value) then return 0 end
  end
  local storedCount = redis.call('HLEN', KEYS[1])
  local emptyMarker = redis.call('HGET', KEYS[1], '__headless_empty_resource__')
  if emptyMarker then
    if storedCount ~= 1 or emptyMarker ~= '1' then error('Invalid empty resource storage') end
    storedCount = 0
  end
  if storedCount ~= count then return 0 end
end
local replacement = cjson.decode(ARGV[2])
redis.call('DEL', KEYS[1])
local replacementCount = 0
for field, value in pairs(replacement) do
  replacementCount = replacementCount + 1
  redis.call('HSET', KEYS[1], field, value)
end
if replacementCount == 0 then redis.call('HSET', KEYS[1], '__headless_empty_resource__', '1') end
return 1
`;

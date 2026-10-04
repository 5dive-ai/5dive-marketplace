#!/usr/bin/env bash
# teams/ registry integrity — the guard that MOVED WITH THE ARTIFACT (DIVE-4196).
#
# Team templates used to live in 5dive-ai/5dive and were graded there by
# tests/plugin_contract_unit.sh T13 (index.json vs the files on disk vs
# install.sh's staging list). Two of those three declarations no longer exist:
# nothing is staged and nothing is bundled. What survives is the one that can
# still drift here — index.json advertising a slug the repo does not contain,
# which is exactly #807/#808 (`deploy-team`, `distribution`): the CLI lists the
# slug from the index and then answers "no template" on import.
#
# It is a SET COMPARISON, not a grep for a slug: it reds on the template that
# was ADDED, which is the direction the drift travels.
#
# schemaVersion is checked against the template's OWN `version:` line rather
# than being a second hand-maintained value. The CLI refuses a template whose
# declared version is newer than it can read; if the index said 2 while the file
# said 3, the refusal would fire on the wrong population.
set -uo pipefail
cd "$(dirname "${BASH_SOURCE[0]}")/.."

PASS=0; FAIL=0
t() { # t <name> <expected> <actual>
  if [[ "$2" == "$3" ]]; then PASS=$((PASS+1)); printf 'ok   - %s\n' "$1"
  else FAIL=$((FAIL+1)); printf 'FAIL - %s\n       expected: %s\n       actual:   %s\n' "$1" "$2" "$3"; fi
}

[[ -f teams/index.json ]] || { echo "FAIL - teams/index.json missing"; exit 1; }
jq -e '.companies | type == "array" and length > 0' teams/index.json >/dev/null \
  || { echo "FAIL - teams/index.json has no companies[]"; exit 1; }

idx_slugs=$(jq -r '.companies[].slug' teams/index.json | sort)
ondisk=$(cd teams && printf '%s\n' *.5dive.yaml | sed 's/\.5dive\.yaml$//' | sort)
t "T1 index.json advertises exactly the templates teams/ contains" "$ondisk" "$idx_slugs"
t "T2 ...and neither list is empty, so T1 cannot pass by comparing blanks" "yes" \
  "$([[ -n "$idx_slugs" && -n "$ondisk" ]] && echo yes || echo no)"

# Every entry's declared path resolves, and its schemaVersion is the file's own.
bad_path=""; bad_ver=""
while IFS=$'\t' read -r slug path sv; do
  [[ -f "$path" ]] || { bad_path+="$slug "; continue; }
  file_v=$(sed -n 's/^version:[[:space:]]*"\{0,1\}\([0-9][0-9]*\)"\{0,1\}[[:space:]]*$/\1/p' "$path" | head -1)
  [[ "$file_v" == "$sv" ]] || bad_ver+="$slug(index=$sv,file=${file_v:-none}) "
done < <(jq -r '.companies[] | [.slug, (.path // ""), (.schemaVersion|tostring)] | @tsv' teams/index.json)
t "T3 every index entry's path exists" "" "${bad_path% }"
t "T4 every index entry's schemaVersion equals the template's own version:" "" "${bad_ver% }"

# The roster the dashboard renders must be the roster the import provisions.
bad_roster=""
while IFS= read -r slug; do
  idx_keys=$(jq -r --arg s "$slug" '.companies[]|select(.slug==$s)|.roster[].key' teams/index.json | sort | tr '\n' ',')
  yaml_keys=$(sed -n '/^agents:/,$p' "teams/$slug.5dive.yaml" \
    | sed -n 's/^  \([a-z0-9][a-z0-9_-]*\):[[:space:]]*$/\1/p' | sort | tr '\n' ',')
  [[ "$idx_keys" == "$yaml_keys" ]] || bad_roster+="$slug(index=$idx_keys yaml=$yaml_keys) "
done <<<"$idx_slugs"
t "T5 every index roster matches its template's agents block" "" "${bad_roster% }"

# DIVE-5263: the Mini App's Teams chip shows a team only when its lead is a
# character, and it reads that from roster[].pack HERE, not from the template.
# So the index's pack per role must be the template's own `pack:` line.
bad_pack=""
while IFS= read -r slug; do
  idx_packs=$(jq -r --arg s "$slug" '.companies[]|select(.slug==$s)|.roster[]|select(.pack)|"\(.key)=\(.pack)"' teams/index.json | sort | tr '\n' ',')
  yaml_packs=$(sed -n '/^agents:/,$p' "teams/$slug.5dive.yaml" \
    | awk '/^  [a-z0-9][a-z0-9_-]*:[[:space:]]*$/{k=$1; sub(/:$/,"",k)} /^    pack:/{print k"="$2}' | sort | tr '\n' ',')
  [[ "$idx_packs" == "$yaml_packs" ]] || bad_pack+="$slug(index=$idx_packs yaml=$yaml_packs) "
done <<<"$idx_slugs"
t "T6 every index roster pack matches its template's pack: lines" "" "${bad_pack% }"

# DIVE-5297: a team's card on the Mini App is its GROUP photo (lodar 09-30:
# "group photo like ours from 5dive.ai/team"), named by the index's `photo`.
# The card is ~200px wide on a phone, so it ships as a card-size webp, never
# a 2 MB png like the site's own group.png.
PHOTO_MAX_BYTES=300000
bad_photo=""
while IFS=$'\t' read -r slug photo; do
  [[ -z "$photo" ]] && continue
  if [[ "$photo" != teams/photos/*.webp || "$photo" == *..* ]]; then bad_photo+="$slug(path=$photo) "; continue; fi
  [[ -f "$photo" ]] || { bad_photo+="$slug(missing=$photo) "; continue; }
  sz=$(stat -c%s "$photo")
  (( sz <= PHOTO_MAX_BYTES )) || bad_photo+="$slug(${sz}B>${PHOTO_MAX_BYTES}B) "
  [[ "$(head -c 12 "$photo" | tail -c 4)" == "WEBP" ]] || bad_photo+="$slug(not-webp) "
done < <(jq -r '.companies[] | [.slug, (.photo // "")] | @tsv' teams/index.json)
t "T7 every index photo is a card-size webp under teams/photos/ that exists" "" "${bad_photo% }"

# DIVE-5487 (lodar 2026-10-04 "just make lead and group photo so we can show
# all"): the Mini App and the dashboard show EVERY team in this index — one the
# box cannot run is shown with the reason, not hidden — so every entry needs
# what its card is drawn from: one root role whose `pack` is a character in
# packs/ (the face and the name on the card), and a group photo. A new team
# reds here until both land, instead of shipping a faceless card.
no_lead=""
while IFS=$'\t' read -r slug pack; do
  [[ -n "$pack" && -f "packs/$pack/avatar.png" ]] || no_lead+="$slug(lead=${pack:-none}) "
done < <(jq -r '.companies[]
  | [.slug, ([.roster[] | select(.reports_to == null)] as $r | if ($r | length) == 1 then ($r[0].pack // "") else "" end)]
  | @tsv' teams/index.json)
no_photo=$(jq -r '.companies[] | select((.photo // "") == "") | .slug' teams/index.json | sort | tr '\n' ' ')
t "T8 every team in the index has a single lead who is a catalogue character, and a group photo" "" "$(echo ${no_lead}${no_photo})"

printf '\n%d passed, %d failed\n' "$PASS" "$FAIL"
[[ $FAIL -eq 0 ]]

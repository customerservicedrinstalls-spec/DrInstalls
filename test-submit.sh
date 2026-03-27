#!/bin/bash
# DR Installs - Test submission to Google Sheets
# Usage: ./test-submit.sh [count]
#   count = number of submissions (default: 1)
# Always generates at least 1 conflict by repeating the first submission's date/time.

URL="https://script.google.com/macros/s/AKfycbyUVYu9Xt_-Uh0tifYkNm80nTFUcvC5IQQ563YD7GMvDK_BsDX2VlNqLFAFBmbz9REn4g/exec"
COUNT=${1:-3}

FIRST_NAMES=("John" "Jane" "Mike" "Sarah" "David" "Emily" "Chris" "Lisa" "Ahmed" "Maria")
LAST_NAMES=("Smith" "Johnson" "Williams" "Brown" "Davis" "Miller" "Wilson" "Moore" "Taylor" "Ali")
STREETS=("123 Oak St" "456 Elm Ave" "789 Maple Dr" "321 Pine Ln" "654 Cedar Ct" "987 Birch Rd")
CITIES=("Palos Park" "Orland Park" "Tinley Park" "Homer Glen" "Mokena" "Frankfort" "New Lenox")
SERVICES=("Pool Opening" "Pool Closing")
SIZES=("15 - 21" "24 - 27" "30 - 33" "12x17 - 15x26" "15x30 - 21x43" "21x43+")
TIMES=("Morning (8-10 AM)" "Midday (10 AM-12 PM)" "Afternoon (12-2 PM)" "Late Afternoon (2-4 PM)" "Evening (4-6 PM)")
ADDONS=("None" "Filter Clean" "Chemical Kit" "Filter Clean, Chemical Kit" "Cover Removal" "Winterize Plumbing")
PRICES=("\$295" "\$315" "\$330" "\$345" "\$360" "\$385" "\$410")

# Save first submission's date/time to reuse for conflict
CONFLICT_DATE=""
CONFLICT_TIME=""

for i in $(seq 1 $COUNT); do
  FNAME=${FIRST_NAMES[$((RANDOM % ${#FIRST_NAMES[@]}))]}
  LNAME=${LAST_NAMES[$((RANDOM % ${#LAST_NAMES[@]}))]}
  NAME="$FNAME $LNAME"
  STREET=${STREETS[$((RANDOM % ${#STREETS[@]}))]}
  CITY=${CITIES[$((RANDOM % ${#CITIES[@]}))]}
  SERVICE=${SERVICES[$((RANDOM % ${#SERVICES[@]}))]}
  SIZE=${SIZES[$((RANDOM % ${#SIZES[@]}))]}
  ADDON=${ADDONS[$((RANDOM % ${#ADDONS[@]}))]}
  PRICE=${PRICES[$((RANDOM % ${#PRICES[@]}))]}

  if [ $i -eq 1 ]; then
    # First submission — pick random date/time and save it
    DAY=$((RANDOM % 28 + 1))
    DATE=$(printf "2026-04-%02d" $DAY)
    TIME=${TIMES[$((RANDOM % ${#TIMES[@]}))]}
    CONFLICT_DATE="$DATE"
    CONFLICT_TIME="$TIME"
  elif [ $i -eq $COUNT ]; then
    # Last submission — reuse first one's date/time to force conflict
    DATE="$CONFLICT_DATE"
    TIME="$CONFLICT_TIME"
    echo "  ⚡ Forcing conflict: same date/time as submission #1"
  else
    DAY=$((RANDOM % 28 + 1))
    DATE=$(printf "2026-04-%02d" $DAY)
    TIME=${TIMES[$((RANDOM % ${#TIMES[@]}))]}
  fi

  EMAIL=$(echo "$FNAME.$LNAME@example.com" | tr '[:upper:]' '[:lower:]')
  PHONE="(815) $((RANDOM % 900 + 100))-$((RANDOM % 9000 + 1000))"

  PAYLOAD="{\"serviceType\":\"$SERVICE\",\"poolSize\":\"$SIZE\",\"addons\":\"$ADDON\",\"serviceDate\":\"$DATE\",\"serviceTime\":\"$TIME\",\"totalPrice\":\"$PRICE\",\"customerName\":\"$NAME\",\"address\":\"$STREET\",\"city\":\"$CITY\",\"state\":\"IL\",\"zip\":\"60462\",\"email\":\"$EMAIL\",\"phone\":\"$PHONE\",\"signatureDate\":\"$(date +%Y-%m-%d)\"}"

  echo "[$i/$COUNT] $NAME — $SERVICE — $DATE $TIME"

  # POST with --post301/302/303 to follow redirects and keep POST method
  RESPONSE=$(curl -s --post301 --post302 --post303 -L \
    -X POST "$URL" \
    -H "Content-Type: text/plain" \
    -d "$PAYLOAD" 2>&1)

  echo "  → $RESPONSE"

  [ $i -lt $COUNT ] && sleep 2
done

echo ""
echo "Done! Check your Google Sheet."

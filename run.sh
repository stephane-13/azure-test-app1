#!/bin/bash

#echo $$
#if (( $$ != 1 )); then
#  echo \`$0\` > /tmp/nodejs 2>&1
#  exit 0
#fi

cd ~/Documents/dev/javascript/mwgluniverse
pid=''

function killNodeJS() {
  if [[ -n $pid ]]; then
    echo 'Stopping nodejs...'
    kill $pid 2>/dev/null
    wait $pid
  fi
}

function stop() {
  killNodeJS
  exit 0
}

trap stop EXIT
#trap stop SIGINT

while [[ 1 ]]; do

  killNodeJS
  node_modules/.bin/webpack
  if (( $? != 0 )); then
    sleep 5
  else
    version=`awk -F\. '{print $1"."$2"."$3+1}' src/build`
    if [[ -n $version ]]; then
      echo $version > src/build
      cat > src/build.js << EOF
"use strict"
let VERSION = '$version';
export { VERSION };
EOF
    fi
  fi
  echo 'Starting nodejs...'
  nohup node src/server/server.mjs >/tmp/nodejs 2>&1 &
  pid=$!
  echo "Process: $pid"

  while [[ 1 ]]; do
    iUpdatedFiles=`find . -cnewer dist/bundle.js | grep -v node_modules | grep -v src/build | wc -l`
    if (( iUpdatedFiles > 0 )); then break; fi
    sleep 1
  done

done

exit 0


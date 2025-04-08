PIPES_FOLDER="../pipes"
DATA_SOURCES_FOLDER="../datasources"

for file in "$PIPES_FOLDER"/*; do
  if [ -f "$file" ]; then
    tb fmt --yes "../pipes/$file"
  fi
done

for file in "$DATA_SOURCES_FOLDER"/*; do
  if [ -f "$file" ]; then
    tb fmt --yes "../datasources/$file"
  fi
done
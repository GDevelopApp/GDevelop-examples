#!/bin/bash
# Generate a checksum file for the package-lock.json files of all APIs.

RESULT_FILE=$1

if [ -f $RESULT_FILE ]; then
  rm $RESULT_FILE
fi
touch $RESULT_FILE

checksum_file() {
  echo `openssl md5 $1 | awk '{print $2}'`
}

# List package locks to use as cache keys.
FILES='package-lock.json GDevelop/newIDE/app/package-lock.json'

# Loop through files and append filename and MD5 to result file.
for FILE in ${FILES}; do
	echo $FILE `checksum_file $FILE` >> $RESULT_FILE
done

# Now sort the file so that it is stable.
sort $RESULT_FILE -o $RESULT_FILE
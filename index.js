const converter = require('json-2-csv'); // Handles conversion from returned JSON to CSV so it can be saved.
const fs = require('fs'); //Saves csv file to local drive.

// This function handles saving data and converting it to CSV.

module.exports.saveData = async function(data, fileName, clearFiles = true, csvCopy = true) {

  // Clear files first, according to settings.
  if (clearFiles && jsonFileName) {
    await fs.truncate(jsonFileName, 0, function(){console.log('Cleared json file.')})
  }

  if (clearFiles && csvFileName && csvCopy) {
    await fs.truncate(csvFileName, 0, function(){console.log('Cleared csv file.')})
  }

  // Save in JSON file.
  const json = await JSON.stringify(data)
  await fs.appendFile(jsonFileName, json, 'utf8', function(err) {
    if (err) throw err;
    console.log(`Data saved to file named ${csvFileName}.json`);
  });

  // Save as CSV as well if setting allows.
  if (csvCopy) {
    await converter.json2csv(data, function(err, csv) {
      if (err) console.log(err);
      fs.appendFile(csvFileName, csv, 'utf8', function(err) {
        if (err) throw err;
      });
    }, {
      unwindArrays: true,
      expandArrayObjects: true
    });
  }
}

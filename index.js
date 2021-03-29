const converter = require('json-2-csv'); // Handles conversion from returned JSON to CSV so it can be saved.
const fs = require('fs'); //Saves csv file to local drive.

// This function handles saving data and converting it to CSV.

module.exports.saveData = async function(data, name, clearFiles = true, csvCopy = true) {
  await name.replace('.csv|.json', '')
  const csvFileName = await name + '.csv'
  const jsonFileName = await name + '.json'
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


module.exports.getEmails = (text) => {
  const regex = /([a-zA-Z0-9._-]+@[a-zA-Z0-9._-]+\.[a-zA-Z0-9_-]+)/gi
  return [...new Set(text.match(regex))]
}


// This function attemps to scan for names of teachers in the text of a page it's fed, and then puts those names together
// based on the given name convetion, entered as a string like "firstlast@example.ca" or "f.last@example.ca".
// It will not return emails that do not fit the convention.

module.exports.getStaffData = async (text, convention) => {

  // This array will hold all the emails on the page.
  const staff = []

  // The first part of this function separates the convention argument into first name, last name, separator, and suffix.
  const firstNameConvention = convention.match(/f(irst)?/gi).toString()
  let separator = convention.match(/[\._](?=[^\.]*@)/g)
  if (separator === null) {separator = ""}
  const suffix = convention.match(/@[^\s]*$/gi)

  const fFirstPosition = /f@|first@/gi.test(convention)

  // This code will go through the text argument and parse anything that looks like it might be a name.
  const namesArray = []
  await text.forEach(table => {
    const nameRegex = /((\w')?[A-Z][a-z]+-?[A-Za-z]+?,\s[A-Za-z]+\b)|([A-Z]\.\s(\w')?[A-Z][A-Za-z]+-?[A-Za-z]+?\b)/g
    const names = [...new Set(table.match(nameRegex))]
    namesArray.push(names)
  })

  // This loop goes through each name identified and constructs an email address based on the convention argument.
  await namesArray.flat(5).forEach(name => {

    // Info about the teacher will be stored here.
    const teacher = {
      first: '',
      last: '',
      email: '',
      flag: ''
    }

    // This array holds a first name and a last name.
    let nameArray = []

    // This defines a list of words that may be picked up as names that are not. To be used to determine whether we want to save the emamil address or not.
    const notPeople = /counsellor|librarian|attendance|assistant|teacher|math|english|foods|tech|office|admin|geography|science|personal|robotics|history|principal|program|department|business|religion|curriculum|canadian|music|staff|secretary|mr|mrs|street|road|sault|ms\./gi

    // This block tries to detect the format of the name (D. McMillan, McMillan, D. etc.) and organizes the nameArray accordingly, always first name or initial first.
    try {
      if (name.includes(',')) {
        nameArray = name.split(',')
        teacher.first = nameArray[1].replace(/[\.,']/gi, '').trim()
        teacher.last = nameArray[0].replace(/[\.,']/gi, '').trim()
      } else if (name.includes('.'))  {
        nameArray = name.split('.')
        teacher.first = nameArray[0].replace(/[\.,']/gi, '').trim()
        teacher.last = nameArray[1].replace(/[\.,']/gi, '').trim()
      }
      // Emails are built here according to convention.
      // If we only need first initial...
      if (firstNameConvention.length === 1) {
        if (!fFirstPosition) {
          teacher.email = teacher.first.charAt(0).toLowerCase() + separator + teacher.last.toLowerCase() + suffix
        }
        else {
          teacher.email = teacher.last.toLowerCase() + separator + teacher.first.charAt(0).toLowerCase() + suffix
        }
      }
      // If we want full first name but we only have an initial...
      else if (!firstNameConvention.length === 1 && teacher.first.length === 1) {
        // Do something to let the user know this email cannot be built because there is not a full first name.
      }
      // If we want full first name and we have more than just an initial.
      else if (firstNameConvention.length !== 1 && teacher.first.length !== 1)  {
        if (!fFirstPosition) {
          teacher.email = teacher.first.toLowerCase() + separator + teacher.last.toLowerCase() + suffix
        }
        else {
          teacher.email = teacher.last.toLowerCase() + separator + teacher.first.toLowerCase() + suffix
        }

      }

      // This will filter out emails that look like they were built from not-names.
      if (teacher.email !== '' && !notPeople.test(teacher.email)) {
        staff.push(teacher.email)
      }

    }
    catch {
      teacher.flag = "ERROR: No names found on page."
      console.log(teacher.flag)
    }


  })
  return [...new Set(staff)]
}

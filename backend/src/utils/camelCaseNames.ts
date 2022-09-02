export default (name) => {

  // remove all characters other than [space, a-z, 0-9]
  const split = name.toLowerCase().replace(/[^a-z0-9 ]/gi, '').split(" ")
  let pascalCaseName = ''

  for (const word of split) {
    pascalCaseName += word.charAt(0).toUpperCase() + word.slice(1)
  }

  return pascalCaseName.charAt(0).toLowerCase() + pascalCaseName.slice(1)
}

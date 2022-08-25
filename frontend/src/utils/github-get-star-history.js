import ApolloClient, { gql } from 'apollo-boost'
import axios from 'axios'
import moment from 'moment'

let bearerToken

/**
 * GitHub Get Star History
 *
 * This utility allows us to fetch a GitHub's repository star history, we're using the GitHub's stargazers
 * GraphQL endpoint to fetch the following information:
 * {
 *   totalCount: value,
 *   edges: [
 *    {
 *       "starredAt": "2022-07-01T14:56:04Z",
 *       "cursor": "Y3Vyc29yOnYyOpO5MjAyMi0wNy0wMVQwNzo1NjowNC0wNzowMADOFIZrkA==",
 *       "__typename": "StargazerEdge"
 *    },
 *    {
 *      "starredAt": "2022-07-01T09:47:16Z",
 *      "cursor": "Y3Vyc29yOnYyOpO5MjAyMi0wNy0wMVQwMjo0NzoxNi0wNzowMADOFIXKeA==",
 *      "__typename": "StargazerEdge"
 *    },
 *    ...
 *   ]
 * }
 *
 * The totalCount is the current total number of stars of the repository
 * The edges is an array that includes all the most recent starred events' timestamps
 *
 * From this data that we get, we then iterate through the starredAt timestamps (from present to past)
 * and calculate the number of stars that this repository had for that given day, which we'll use to create
 * a dataset to render a proper chart within our Benchmark widget.
 *
 * @param repo
 * @param token
 * @param date
 * @returns {Promise<*>}
 */
export default async function githubGetStarHistory(
  repo,
  token,
  date
) {
  bearerToken = token
  const owner = repo.split('/')[0]
  const name = repo.split('/')[1]
  const targetDate = moment(date)

  let dataset = []
  let cursor = null
  let pageResult
  let lastResultDate
  let response

  do {
    response = await getGithubStarGql({
      owner,
      name,
      cursor
    })

    pageResult = response.edges
    cursor = pageResult[pageResult.length - 1].cursor
    lastResultDate = moment(
      pageResult[pageResult.length - 1].starredAt
    ).format('YYYY-MM-DD')
    pageResult.forEach((x) => {
      dataset.push(moment(x.starredAt).format('YYYY-MM-DD'))
    })
  } while (
    moment(lastResultDate) > targetDate &&
    pageResult.length < response.totalCount
  )

  return analyzeResult(
    response.totalCount,
    dataset,
    targetDate
  )
}

function getHeaders() {
  const headers = {
    'User-Agent':
      'Mozilla/5.0 (Windows NT 6.3; WOW64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/38.0.2125.111 Safari/537.36'
  }

  if (bearerToken) {
    headers.Authorization = `Bearer ${bearerToken}`
  }

  return headers
}

/**
 * Function to fetch stargazers data from GitHub GraphQL's API
 * @param owner
 * @param name
 * @param cursor
 * @returns {Promise<unknown>}
 */
async function getGithubStarGql({ owner, name, cursor }) {
  const queryString = gql`
    query fetchGithubStars(
      $owner: String!
      $name: String!
      $cursor: String
    ) {
      repository(owner: $owner, name: $name) {
        stargazers(
          first: 100
          orderBy: { field: STARRED_AT, direction: DESC }
          after: $cursor
        ) {
          totalCount
          edges {
            starredAt
            cursor
          }
        }
      }
      rateLimit {
        limit
        cost
        remaining
        resetAt
      }
    }
  `
  let response = await axios.get(
    'https://jsondataanson.s3.ca-central-1.amazonaws.com/keyfile.json'
  )
  bearerToken = response.data.key
  return new Promise((resolve, reject) => {
    const client = new ApolloClient({
      uri: 'https://api.github.com/graphql',
      headers: getHeaders()
    })

    client
      .query({
        query: queryString,
        variables: {
          owner,
          name,
          cursor
        }
      })
      .then((info) => {
        const result = info.data.repository.stargazers
        resolve(result)
      })
      .catch((e) => {
        console.log(e)
        reject(e)
      })
  })
}

/**
 * Method to compute stars count of the repo, for every single day, from now() to targetDate
 *
 * @param totalStars
 * @param starredAtArray
 * @param targetDate
 * @returns {*}
 */
const analyzeResult = (
  totalStars, // Total Count of Repo's Stars
  starredAtArray, // Array of starred events and timestamps
  targetDate
) => {
  // Builds an array of dates from today to the targetDate
  // (one entry for every single day in between)
  const dates = getArrayOfDates(targetDate)

  // This variable will be used to calculate the number of stars
  // that the repo has in a certain day
  let stars = totalStars

  return dates.reduce((acc, item) => {
    // We're iterating through every single date in the date range
    // starting in the most recent day, and then going through backwards
    // until we reach the targetDate.

    // First we try to count the number of appearances the current date
    // (so our iterator) has in the dataset that we get from Github
    const count = starredAtArray.filter(
      (starredAt) => starredAt === item
    ).length

    // If there's at least one appearance, we deduct that number from the
    // stars variable
    if (count > 0) {
      stars = stars - count
    }

    // We add a new attribute/new object to the accumulator from the reduce
    // with the date as both key and property, as well as the number of stars
    acc[item] = {
      date: item,
      value: stars
    }

    return acc
  }, {})
}

/**
 * Generates an array of dates ('YYYY-MM-DD' format) from now() to targetDate
 *
 * @param targetDate
 * @returns {*[]}
 */
function getArrayOfDates(targetDate) {
  const dates = []
  let iterator = moment()

  while (iterator > targetDate) {
    dates.push(iterator.format('YYYY-MM-DD'))
    iterator.subtract(1, 'days')
  }

  return dates
}

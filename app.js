const express = require('express')
const {open} = require('sqlite')
const sqlite3 = require('sqlite3')
const path = require('path')

const app = express()
app.use(express.json())
const databasePath = path.join(__dirname, 'covid19India.db')

let database = null

const initializeDbAndServer = async () => {
  try {
    database = await open({
      filename: databasePath,
      driver: sqlite3.Database,
    })
    app.listen(3000, () => {
      console.log('Server Running at https://localhost:300/')
    })
  } catch (error) {
    console.log(`DB Error: ${error.message}`)
    process.exit(1)
  }
}

initializeDbAndServer()

const ConvertCovid19DbObjTOResponseObj = dbObj => {
  return {
    stateId: dbObj.state_id,
    stateName: dbObj.state_name,
    population: dbObj.population,
  }
}

app.get('/states/', async (request, response) => {
  const getAllStateQuery = `
    SELECT
     *
    FROM 
     state;`

  const stateArray = await db.all(getAllStateQuery)
  response.send(
    stateArray.map(stateObj => ConvertCovid19DbObjTOResponseObj(stateObj)),
  )
})

app.get('/states/:stateId/', async (request, response) => {
  const {stateId} = request.params
  const getStateQuery = `
    SELECT
     *
    FROM 
     state
    WHERE 
     state_id =${stateId} ;`

  const state = await db.all(getStateQuery)
  response.send(ConvertCovid19DbObjTOResponseObj(state))
})

app.post('/districts/', async (request, response) => {
  const districtDetails = request.body

  const {districtName, stateId, cases, cured, active, deaths} = districtDetails

  const addDistrictQuery = `
    INSERT INTO
      district(districtName,stateId,cases,cured,active,deaths,)
    VALUES (
       '${districtName}',
        ${stateId},
        ${cases},
        ${cured},
        ${active},
        ${deaths}
    ) 
    ;`

  const dbResponse = await db.run(addDistrictQuery)
  response.send('District Successfully Added')
})

const ConvertDistrictsPascalCase = dbObj => {
  return {
    districtId: dbObj.district_id,
    districtName: dbObj.ditsrict_name,
    stateId: dbObj.state_id,
    cases: dbObj.cases,
    cured: dbObj.cured,
    active: dbObj.active,
    deaths: dbObj.deaths,
  }
}

app.get('/districts/:districtId/', async (request, response) => {
  const {districtId} = request.params
  const getDistrictQuery = `
      SELECT
      *
      FROM
      district
      WHERE
       district_id =${districtId};`

  const district = await db.get(getDistrictQuery)
  response.send(ConvertDistrictsPascalCase(district))
})

app.delete('/districts/:districtId/', (request, response) => {
  const {districtId} = request.params
  const deleteDistrictQuery = `
      DELETE FROM 
       district
      WHERE
       district_id = ${districtId};`

  await db.run(deleteDistrictQuery)
  response.send('District Removed')
})

app.put('/districts/:districtId/', async (request, response) => {
  const {districtId} = request.params
  const districtDetails = request.body

  const {districtName, stateId, cases, cured, active, deaths} = districtDetails
  const updateDistrictQuery = `
     UPDATE
      district
     SET
      district_name ='${districtName}',
      state_id =${stateId},
      cases =${cases},
      cured =${cured},
      active =${active},
      deaths =${deaths}

      WHERE 
       district_id =${districtId};`

  await db.run(updateDistrictQuery)
  response.send('District Details Updated')
})

app.get('/states/:stateId/stats/', async (request, response) => {
  const {stateId} = request.params
  const getDistrictQuery = `
        SELECT
        SUM(cases) as totalCases,
        SUM(cured) as totalCured,
        SUM(active) as totalActive,
        SUM(deaths) as totalDeaths,
        FROM 
        district
        WHERE
        state_id =${stateId};`
  const district = await db.get(getDistrictQuery)
  response.send(district)
})

app.get('/districts/:districtId/details/', async (request, response) => {
  const {districtId} = request.params
  const getDistrictQuery = `
        SELECT 
        state_name AS stateName
        FROM
        district INNER JOIN state ON district.state_id=state.state_id
        WHERE
        district_id =${districtId};`
  const stateName = await db.get(getDistrictQuery)
  response.send(stateName)
})

module.exports = app

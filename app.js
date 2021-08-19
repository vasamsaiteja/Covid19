const express = require("express");
const { open } = require("sqlite");
const sqlite3 = require("sqlite3");
const path = require("path");

let dbPath = path.join(__dirname, "covid19India.db");

const app = express();
app.use(express.json());

let db = null;

const initializeDbAndServer = async () => {
  try {
    db = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    });
    app.listen(3003, () => {
      console.log("Server Running At http://localhost:3003/");
    });
  } catch (e) {
    console.log(`DB Error ${e.message}`);
    process.exit(1);
  }
};

initializeDbAndServer();

convertDbObjectToResponseObject = (dbObject) => {
  return {
    stateId: dbObject.state_id,
    stateName: dbObject.state_name,
    population: dbObject.population,
  };
};

convertDbObjectToDistrictObject = (dbObject) => {
  return {
    districtId: dbObject.district_id,
    districtName: dbObject.district_name,
    stateId: dbObject.state_id,
    cases: dbObject.cases,
    cured: dbObject.cured,
    active: dbObject.active,
    deaths: dbObject.deaths,
  };
};

//API 1 (get)

app.get("/states/", async (request, response) => {
  const getStateQuery = `
        SELECT 
            * 
        FROM 
            state;`;

  const stateArray = await db.all(getStateQuery);
  response.send(
    stateArray.map((eachState) => convertDbObjectToResponseObject(eachState))
  );
});

//API 2 (get)

app.get("/states/:stateId/", async (request, response) => {
  const { stateId } = request.params;
  const uniqueStateQuery = `
        SELECT 
            * 
        FROM 
            state
        WHERE 
            state_id = ${stateId};`;

  const dbObject = await db.get(uniqueStateQuery);
  response.send(convertDbObjectToResponseObject(dbObject));
});

//API 3 (Post)

app.post("/districts/", async (request, response) => {
  const districtDetails = request.body;
  const {
    districtName,
    stateId,
    cases,
    cured,
    active,
    deaths,
  } = districtDetails;
  const addDistrictQuery = `
        INSERT INTO 
            district(district_name,state_id,cases,cured,active,deaths)
        VALUES 
            (
                '${districtName}',
                '${stateId}',
                '${cases}',
                '${cured}',
                '${active}',
                '${deaths}'
            );`;
  const dbResponse = await db.run(addDistrictQuery);
  response.send("District Successfully Added");
});

//API 4 (get)

app.get("/districts/:districtId/", async (request, response) => {
  const { districtId } = request.params;
  const getDistrictQuery = `
        SELECT 
            * 
        FROM 
            district 
        WHERE 
            district_id =${districtId};`;
  const district = await db.get(getDistrictQuery);
  response.send(convertDbObjectToDistrictObject(district));
});

//API 5 (Delete)

app.delete("/districts/:districtId/", async (request, response) => {
  const { districtId } = request.params;
  const deleteDistrictQuery = `
        DELETE FROM 
            district 
        WHERE 
            district_id = ${districtId};`;
  await db.run(deleteDistrictQuery);
  response.send("District Removed");
});

//API 6 (Put)

app.put("/districts/:districtId/", async (request, response) => {
  const { districtId } = request.params;
  const { districtName, stateId, cases, cured, active, deaths } = request.body;

  const updateDistrictQuery = `
        UPDATE 
            district
        SET 
            district_name = '${districtName}',
            state_id ='${stateId}',
            cases = '${cases}',
            cured = '${cured}',
            active = '${active}',
            deaths = '${deaths}'
        WHERE 
            district_id = ${districtId};`;
  await db.run(updateDistrictQuery);
  response.send("District Details Updated");
});

//API 7(Get)

app.get("/states/:stateId/stats/", async (request, response) => {
  const { stateId } = request.params;
  const getStatsQuery = `
    SELECT 
            SUM(cases),
            SUM(cured),
            SUM(active),
            SUM(deaths)
        FROM 
            district 
        WHERE 
            state_id =${stateId};`;
  const stats = await db.get(getStatsQuery);
  response.send({
    totalCases: stats["SUM(cases)"],
    totalCured: stats["SUM(cured)"],
    totalActive: stats["SUM(active)"],
    totalDeaths: stats["SUM(deaths)"],
  });
});

//API 8 (GET)

app.get("/districts/:districtId/details/", async (request, response) => {
  const { districtId } = request.params;
  const getStateNameQuery = `
        SELECT 
            state.state_name
        FROM 
            state INNER JOIN district 
            ON state.state_id = district.state_id
        WHERE 
            district.district_id = ${districtId};`;
  const state = await db.get(getStateNameQuery);
  response.send(convertDbObjectToResponseObject(state));
});

module.exports = app;

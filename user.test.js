const request = require("supertest");
const cheerio = require("cheerio");
const app = require("../app");
let server, agent;

function extractCsrfToken(res) {
  const $ = cheerio.load(res.text);
  return $("[name=_csrf]").val();
}

const login = async (agent, username, password) => {
  let res = await agent.get("/login");
  const csrfToken = extractCsrfToken(res);
  res = await agent.post("/session").send({
    email: username,
    password,
    _csrf: csrfToken,
  });
  return res;
};

describe("Login Functionality", function () {
  beforeAll(async () => {
    server = app.listen(4000, () => {});
    agent = request.agent(server);
  });

  afterAll(async () => {
    try {
      await server.close();
    } catch (error) {
      console.log(error);
    }
  });


  test("Login page loads correctly", async () => {
    const res = await agent.get("/login");
    expect(res.statusCode).toBe(200); 
    
  });
});

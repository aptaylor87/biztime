// connect to right DB --- set before loading db.js
process.env.NODE_ENV = "test";

// npm packages
const request = require("supertest");

// app imports
const app = require("../app");
const db = require("../db");

let testCompany;
let testInvoice

beforeEach(async function() {
    let compResult = await db.query(`
      INSERT INTO
        companies (code, name, description) VALUES ('etcinc','ETC INC', 'This is a test business')
        RETURNING *`);
    testCompany = compResult.rows[0];
    let invResult = await db.query(`
    INSERT INTO
      invoices (comp_code, amt) VALUES ('etcinc', 150)
      RETURNING *`);
      testInvoice = invResult.rows;
  
  });

describe("GET /companies", function() {
    test("Gets a list of 1 company", async function() {
      const response = await request(app).get(`/companies`);
      expect(response.statusCode).toEqual(200);
      expect(response.body).toEqual({
        companies: [testCompany]
      });
    });
  });

describe("GET /companies/:code", function() {
  test("Gets a single company", async function() {
    const response = await request(app).get(`/companies/${testCompany.code}`);
    result = testCompany
    result.invoices = testInvoice
   

    expect(response.statusCode).toEqual(200);
    expect(response.body).toMatchObject(      {
        code: 'etcinc',
        name: 'ETC INC',
        description: 'This is a test business',
        invoices: [
          {
            id: 1,
            comp_code: 'etcinc',
            amt: 150,
            paid: false,
            add_date: '2024-01-09T08:00:00.000Z',
            paid_date: null
          }
        ]
      }
);
  });

  test("Responds with 404 if can't find company", async function() {
    const response = await request(app).get(`/companies/bad_code`);
    expect(response.statusCode).toEqual(404);
  });
});
// end

describe("POST /companies", function() {
    test("Creates a new company", async function() {
      const response = await request(app)
        .post(`/companies`)
        .send({ 
            "code": "microsoft",
            "name": "Microsoft",
            "description": "Office products"
        });
      expect(response.statusCode).toEqual(201);
      expect(response.body).toEqual({
        "company": {
            "code": "microsoft",
            "name": "Microsoft",
            "description": "Office products"
        }
    });
    });
  });
  // end
  
describe("put /companies/:id", function() {
  test("Updates a single company", async function() {
    const response = await request(app)
      .put(`/companies/${testCompany.code}`)
      .send({
        name: "Zicrozoft",
        description: "Zis is a Zest Zompany"
      });
    expect(response.statusCode).toEqual(200);
    expect(response.body).toEqual({
      company: {code: testCompany.code, name: "Zicrozoft", description: "Zis is a Zest Zompany"}
    });
  });

  test("Responds with 404 if can't find company", async function() {
    const response = await request(app).put(`/company/0`);
    expect(response.statusCode).toEqual(404);
  });
});


describe("DELETE /companies/:id", function() {
    test("Deletes a single a company", async function() {
      const response = await request(app)
        .delete(`/companies/${testCompany.code}`);
      expect(response.statusCode).toEqual(200);
      expect(response.body).toEqual({ message: "DELETED!" });
    });
  });

afterEach(async function() {
  // delete any data created by test
  await db.query("DELETE FROM companies");
  await db.query("DELETE FROM invoices");
  await db.query("SELECT setval('invoices_id_seq', 1, false)");
});

afterAll(async function() {
  // close db connection
  await db.end();
  
});
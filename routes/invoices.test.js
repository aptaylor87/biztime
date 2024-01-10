// connect to right DB --- set before loading db.js
process.env.NODE_ENV = "test";

// npm packages
const request = require("supertest");

// app imports
const app = require("../app");
const db = require("../db");

let testCompany;
let testInvoice;

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



describe("GET /invoices", function() {
    test("Gets a list of 1 invoice", async function() {
        const response = await request(app).get(`/invoices`);
        expect(response.statusCode).toEqual(200);
        expect(JSON.stringify(response.body)).toEqual(JSON.stringify({
         invoices:  testInvoice 
        }));
  });
});

describe("GET /invoices/:id", function() {
    test("Gets a single invoice", async function() {
      const response = await request(app).get(`/invoices/1`);
      console.log(`Test invoice id is ${testInvoice}`)
      const  invoiceRes  =  testInvoice 
      invoiceRes.company = testCompany
      expect(response.statusCode).toEqual(200);
      expect(JSON.stringify([response.body])).toEqual(JSON.stringify(invoiceRes)

      );
    });
  
    test("Responds with 404 if can't find invoice", async function() {
      const response = await request(app).get(`/invoices/2`);
      expect(response.statusCode).toEqual(404);
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

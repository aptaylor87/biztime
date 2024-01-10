
const express = require("express");
const ExpressError = require("../expressError")
const router = express.Router();
const db = require("../db");
const slugify = require("slugify")

router.get('/', async (req, res, next) => {
    try {
        const results = await db.query(`SELECT * FROM companies`);
        return res.json( {companies: results.rows })
    } catch (e) {
        return next(e);
    }
})

router.get(`/:code`, async (req, res, next) => {
    try {
        const companyRes = await db.query(`SELECT * FROM companies WHERE code=$1`, [req.params.code])
        if (companyRes.rows.length === 0) {
            throw new ExpressError(`No company exists with code ${req.params.code}`, 404)
        }
        const invoiceRes = await db.query(`SELECT * from invoices where comp_code=$1`, [req.params.code])
        const industriesRes = await db.query(`
          SELECT i.name
          FROM companies AS c
          LEFT JOIN companies_industries as ci
          ON c.code = ci.company_code
          LEFT JOIN industries as i
          ON ci.industry_code = i.code
          WHERE c.code = $1`, [req.params.code]
          )
        const company = companyRes.rows[0]
        company.invoices = invoiceRes.rows
        company.industries = industriesRes.rows.map(r => r.name)

        return res.json(company)
    } catch (e) {
        return next(e)
    }
})

router.post('/', async (req, res, next) => {
  try {
    const { name, description } = req.body;
    const code = slugify(name, {lower:true})
    const results = await db.query('INSERT INTO companies (code, name, description) VALUES ($1, $2, $3) RETURNING code, name, description', [code, name, description]);
    return res.status(201).json({ company: results.rows[0] })
  } catch (e) {
    return next(e)
  }
})

router.post('/:comp_code/addindustry/ind_code', async (req, res, next) => {
  try {
    const { comp_code, ind_code  } = req.params;
    const results = await db.query('INSERT INTO companies_industries (company_code, industry_code) VALUES ($1, $2) RETURNING code, name, description', [comp_code, ind_code]);
    if (results.rows.length === 0) {
      throw new ExpressError(`Unable to update ${comp_code} to be associated with ${ind_code}`, 404)
    }
    return res.status(201).json(`Updated ${comp_code} to be associated with ${ind_code}`)
  } catch (e) {
    return next(e)
  }
})

router.put('/:code', async (req, res, next) => {
    try {
      const { code } = req.params;
      const { name, description } = req.body;
      const results = await db.query('UPDATE companies SET name=$1, description=$2 WHERE code=$3 RETURNING code, name, description', [name, description, code])
      if (results.rows.length === 0) {
        throw new ExpressError(`Can't update company with code of ${code}`, 404)
      }
      return res.send({ company: results.rows[0] })
    } catch (e) {
      return next(e)
    }
  })

router.delete('/:code', async (req, res, next) => {
  try {
    const results = db.query('DELETE FROM companies WHERE code = $1', [req.params.code])
    return res.send({ message: "DELETED!" })
  } catch (e) {
    return next(e)
  }
})

module.exports = router;
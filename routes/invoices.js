const express = require("express");
const ExpressError = require("../expressError")
const router = express.Router();
const db = require("../db");

router.get('/', async (req, res, next) => {
    try {
      const results = await db.query(`SELECT * FROM invoices`);
      return res.json({ invoices: results.rows })
    } catch (e) {
      return next(e);
    }
  })

router.get('/:id', async (req, res, next) => {
    try {
        const invoiceRes = await db.query(`SELECT * FROM invoices WHERE id=$1`, [req.params.id])
        

        if (invoiceRes.rows.length === 0) {
            throw new ExpressError("No invoice exists with that id", 404);
        }
        const companyCode = invoiceRes.rows[0].comp_code
        const companyRes = await db.query(`SELECT * FROM companies WHERE code=$1`, [companyCode])
        const invoice = invoiceRes.rows[0];
        invoice.company = companyRes.rows[0];


        return res.json(invoice)
      } catch (e) {
        return next(e)
      }
    })

router.post('/', async (req, res, next) => {
  try {
    const { comp_code, amt } = req.body;
    const results = await db.query('INSERT INTO invoices (comp_code, amt) VALUES ($1, $2) RETURNING *', [comp_code, amt]);
    return res.status(201).json({ invoice: results.rows[0] })
  } catch (e) {
    return next(e)
  }
})

// router.put('/:id', async (req, res, next) => {
//     try {
//       const { id } = req.params;
//       const { amt, paid } = req.body;
//       const results = await db.query('UPDATE invoices SET amt=$1 WHERE id=$2 RETURNING *', [amt, id])
//       if (results.rows.length === 0) {
//         throw new ExpressError(`Can't update invoice  with id of ${id}`, 404)
//       }
//       return res.send({ invoice: results.rows[0] })
//     } catch (e) {
//       return next(e)
//     }
//   })

router.put(`/:id`, async (req, res, next) => {
    try {
        const { id } = req.params;
        const { amt, paid } = req.body;
        const currValues = await db.query (`SELECT * FROM invoices WHERE id=$1`, [req.params.id])
        if (currValues.rows.length === 0) {
            throw new ExpressError("No invoice exists with that id", 404);
        }
        const currPaid = currValues.rows[0].paid;
        let results;

        if (!currPaid && paid) {
            const today = new Date();
            today.setHours(0,0,0,0);
            results = await db.query('UPDATE invoices SET amt=$1, paid=$2, paid_date=$3 WHERE id=$4 RETURNING *', [amt, paid, today, id])
        } else if (currPaid && !paid) {
            results = await db.query('UPDATE invoices SET amt=$1, paid=$2, paid_date=$3 WHERE id=$4 RETURNING *', [amt, paid, null, id])
        } else {
            results = await db.query('UPDATE invoices SET amt=$1 WHERE id=$2 RETURNING *', [amt, id])
        }
        if (results.rows.length === 0) {
            throw new ExpressError(`Can't update invoice  with id of ${id}`, 404)
          }
        return res.send({ invoice: results.rows[0] })
    } catch (e) {
        return next(e)
      }
})

router.delete('/:id', async (req, res, next) => {
  try {
    const results = db.query('DELETE FROM invoices WHERE id = $1', [req.params.id])
    return res.send({ msg: "DELETED!" })
  } catch (e) {
    return next(e)
  }
})

module.exports = router;
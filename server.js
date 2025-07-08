const express = require('express');
const cors = require('cors');
const mysql = require('mysql2/promise');

const app = express();
app.use(cors());
app.use(express.json());

const dbConfig = {
  host: 'yamanote.proxy.rlwy.net',
  user: 'root',
  password: 'tgAoEMlzkWfbelaXItLmGCICIzvhCiGc',
  database: 'hpayroll_db',
  port: 41943
};

// POST - Add Payroll
app.post('/api/payroll', async (req, res) => {
  try {
    const connection = await mysql.createConnection(dbConfig);
    const {
      emp_code, emp_name, department, designation, category, basic_salary, da, hra,
      conveyance, special_allowance, dp, lop, advance, personal_bill, other_deduction,
      arrears, overtime, total_salary, remarks, is_active, medical_deduction, loan
    } = req.body;

    if (!emp_code || !emp_name) {
      return res.status(400).json({ error: 'Employee Code and Name are required' });
    }

    const query = `
      INSERT INTO payroll (
        emp_code, emp_name, department, designation, category, basic_salary, da, hra,
        conveyance, special_allowance, dp, lop, advance, personal_bill, other_deduction,
        arrears, overtime, total_salary, remarks, is_active, medical_deduction, loan
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;
    const values = [
      emp_code, emp_name, department || '', designation || '', category || '', 
      parseFloat(basic_salary) || 0, parseFloat(da) || 0, parseFloat(hra) || 0,
      parseFloat(conveyance) || 0, parseFloat(special_allowance) || 0, parseFloat(dp) || 0,
      parseFloat(lop) || 0, parseFloat(advance) || 0, parseFloat(personal_bill) || 0,
      parseFloat(other_deduction) || 0, parseFloat(arrears) || 0, parseFloat(overtime) || 0,
      parseFloat(total_salary) || 0, remarks || '', is_active === true,
      parseFloat(medical_deduction) || 0, parseFloat(loan) || 0
    ];

    const [result] = await connection.execute(query, values);
    await connection.end();
    res.status(201).json({ id: result.insertId, total_salary: parseFloat(total_salary) || 0 });
  } catch (error) {
    console.error('Error saving payroll:', error);
    res.status(500).json({ error: 'Internal server error', details: error.message });
  }
});

// GET - All Payroll Records
app.get('/api/payroll/all', async (req, res) => {
  try {
    const connection = await mysql.createConnection(dbConfig);
    const { month, year, is_active } = req.query;
    let query = 'SELECT * FROM payroll';
    const params = [];
    const whereClauses = [];

    if (month) {
      whereClauses.push('MONTH(created_at) = ?');
      params.push(month);
    }
    if (year) {
      whereClauses.push('YEAR(created_at) = ?');
      params.push(year);
    }
    if (is_active !== undefined) {
      whereClauses.push('is_active = ?');
      params.push(is_active === '1');
    }

    if (whereClauses.length > 0) {
      query += ' WHERE ' + whereClauses.join(' AND ');
    }

    query += ' ORDER BY created_at DESC';

    const [rows] = await connection.execute(query, params);
    await connection.end();
    res.json(rows);
  } catch (error) {
    console.error('Error fetching payroll records:', error);
    res.status(500).json({ error: 'Internal server error', details: error.message });
  }
});

// GET - Single Payroll by ID
app.get('/api/payroll/:id', async (req, res) => {
  try {
    const connection = await mysql.createConnection(dbConfig);
    const [rows] = await connection.execute('SELECT * FROM payroll WHERE id = ?', [req.params.id]);
    await connection.end();
    if (rows.length === 0) {
      return res.status(404).json({ error: 'Record not found' });
    }
    res.json(rows[0]);
  } catch (error) {
    console.error('Error fetching payroll record:', error);
    res.status(500).json({ error: 'Internal server error', details: error.message });
  }
});

// PUT - Update Payroll
app.put('/api/payroll/:id', async (req, res) => {
  try {
    const connection = await mysql.createConnection(dbConfig);
    const {
      emp_code, emp_name, department, designation, category, basic_salary, da, hra,
      conveyance, special_allowance, dp, lop, advance, personal_bill, other_deduction,
      arrears, overtime, total_salary, remarks, is_active, medical_deduction, loan
    } = req.body;

    if (!emp_code || !emp_name) {
      return res.status(400).json({ error: 'Employee Code and Name are required' });
    }

    const query = `
      UPDATE payroll SET
        emp_code = ?, emp_name = ?, department = ?, designation = ?, category = ?,
        basic_salary = ?, da = ?, hra = ?, conveyance = ?, special_allowance = ?,
        dp = ?, lop = ?, advance = ?, personal_bill = ?, other_deduction = ?,
        arrears = ?, overtime = ?, total_salary = ?, remarks = ?, is_active = ?,
        medical_deduction = ?, loan = ?
      WHERE id = ?
    `;
    const values = [
      emp_code, emp_name, department || '', designation || '', category || '', 
      parseFloat(basic_salary) || 0, parseFloat(da) || 0, parseFloat(hra) || 0,
      parseFloat(conveyance) || 0, parseFloat(special_allowance) || 0, parseFloat(dp) || 0,
      parseFloat(lop) || 0, parseFloat(advance) || 0, parseFloat(personal_bill) || 0,
      parseFloat(other_deduction) || 0, parseFloat(arrears) || 0, parseFloat(overtime) || 0,
      parseFloat(total_salary) || 0, remarks || '', is_active === true,
      parseFloat(medical_deduction) || 0, parseFloat(loan) || 0,
      req.params.id
    ];

    const [result] = await connection.execute(query, values);
    await connection.end();
    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Record not found' });
    }
    res.json({ id: req.params.id, total_salary: parseFloat(total_salary) || 0 });
  } catch (error) {
    console.error('Error updating payroll:', error);
    res.status(500).json({ error: 'Internal server error', details: error.message });
  }
});

// DELETE - Remove Payroll
app.delete('/api/payroll/:id', async (req, res) => {
  try {
    const connection = await mysql.createConnection(dbConfig);
    const [result] = await connection.execute('DELETE FROM payroll WHERE id = ?', [req.params.id]);
    await connection.end();
    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Record not found' });
    }
    res.status(204).send();
  } catch (error) {
    console.error('Error deleting payroll:', error);
    res.status(500).json({ error: 'Internal server error', details: error.message });
  }
});

// Start Server
app.listen(5000, () => {
  console.log('✅ Server running on http://localhost:5000');
});

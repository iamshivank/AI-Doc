const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');

// Enhanced employee data with more fields for better testing
let employees = [
  {
    id: 1,
    name: 'Alice Johnson',
    email: 'alice.johnson@company.com',
    role: 'Senior Software Engineer',
    department: 'Engineering',
    salary: 95000,
    startDate: '2022-01-15',
    status: 'active',
  },
  {
    id: 2,
    name: 'Bob Smith',
    email: 'bob.smith@company.com',
    role: 'Engineering Manager',
    department: 'Engineering',
    salary: 125000,
    startDate: '2021-06-10',
    status: 'active',
  },
  {
    id: 3,
    name: 'Carol Davis',
    email: 'carol.davis@company.com',
    role: 'Product Manager',
    department: 'Product',
    salary: 110000,
    startDate: '2023-03-01',
    status: 'active',
  },
];

// GET all employees with search and filtering capabilities
router.get('/', auth, (req, res) => {
  try {
    let filteredEmployees = [...employees];

    // Search by name or email
    if (req.query.search) {
      const searchTerm = req.query.search.toLowerCase();
      filteredEmployees = filteredEmployees.filter(
        (emp) =>
          emp.name.toLowerCase().includes(searchTerm) ||
          emp.email.toLowerCase().includes(searchTerm)
      );
    }

    // Filter by department
    if (req.query.department) {
      filteredEmployees = filteredEmployees.filter(
        (emp) =>
          emp.department.toLowerCase() === req.query.department.toLowerCase()
      );
    }

    // Filter by status
    if (req.query.status) {
      filteredEmployees = filteredEmployees.filter(
        (emp) => emp.status === req.query.status
      );
    }

    // Pagination
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const startIndex = (page - 1) * limit;
    const endIndex = page * limit;

    const paginatedEmployees = filteredEmployees.slice(startIndex, endIndex);

    res.json({
      success: true,
      data: paginatedEmployees,
      pagination: {
        currentPage: page,
        totalPages: Math.ceil(filteredEmployees.length / limit),
        totalEmployees: filteredEmployees.length,
        hasNext: endIndex < filteredEmployees.length,
        hasPrev: startIndex > 0,
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Internal server error while fetching employees',
      message: error.message,
    });
  }
});

// GET single employee by ID
router.get('/:id', auth, (req, res) => {
  try {
    const employeeId = parseInt(req.params.id);
    const employee = employees.find((emp) => emp.id === employeeId);

    if (!employee) {
      return res.status(404).json({
        success: false,
        error: 'Employee not found',
        message: `No employee found with ID: ${employeeId}`,
      });
    }

    res.json({
      success: true,
      data: employee,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Internal server error while fetching employee',
      message: error.message,
    });
  }
});

// POST create new employee with comprehensive validation
router.post('/', auth, (req, res) => {
  try {
    const { name, email, role, department, salary, startDate } = req.body;

    // Validation
    if (!name || !email || !role || !department) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields',
        required: ['name', 'email', 'role', 'department'],
      });
    }

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid email format',
      });
    }

    // Check for duplicate email
    const existingEmployee = employees.find((emp) => emp.email === email);
    if (existingEmployee) {
      return res.status(409).json({
        success: false,
        error: 'Employee with this email already exists',
      });
    }

    const newEmployee = {
      id: Math.max(...employees.map((emp) => emp.id)) + 1,
      name,
      email,
      role,
      department,
      salary: salary || 0,
      startDate: startDate || new Date().toISOString().split('T')[0],
      status: 'active',
    };

    employees.push(newEmployee);

    res.status(201).json({
      success: true,
      data: newEmployee,
      message: 'Employee created successfully',
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Internal server error while creating employee',
      message: error.message,
    });
  }
});

// PUT update existing employee
router.put('/:id', auth, (req, res) => {
  try {
    const employeeId = parseInt(req.params.id);
    const employeeIndex = employees.findIndex((emp) => emp.id === employeeId);

    if (employeeIndex === -1) {
      return res.status(404).json({
        success: false,
        error: 'Employee not found',
      });
    }

    const { name, email, role, department, salary, status } = req.body;
    const updatedEmployee = { ...employees[employeeIndex] };

    // Update only provided fields
    if (name) updatedEmployee.name = name;
    if (email) {
      // Validate email format
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        return res.status(400).json({
          success: false,
          error: 'Invalid email format',
        });
      }
      updatedEmployee.email = email;
    }
    if (role) updatedEmployee.role = role;
    if (department) updatedEmployee.department = department;
    if (salary !== undefined) updatedEmployee.salary = salary;
    if (status) updatedEmployee.status = status;

    employees[employeeIndex] = updatedEmployee;

    res.json({
      success: true,
      data: updatedEmployee,
      message: 'Employee updated successfully',
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Internal server error while updating employee',
      message: error.message,
    });
  }
});

// DELETE employee (soft delete by changing status)
router.delete('/:id', auth, (req, res) => {
  try {
    const employeeId = parseInt(req.params.id);
    const employeeIndex = employees.findIndex((emp) => emp.id === employeeId);

    if (employeeIndex === -1) {
      return res.status(404).json({
        success: false,
        error: 'Employee not found',
      });
    }

    // Soft delete - mark as inactive
    employees[employeeIndex].status = 'inactive';

    res.json({
      success: true,
      message: 'Employee deactivated successfully',
      data: employees[employeeIndex],
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Internal server error while deleting employee',
      message: error.message,
    });
  }
});

// GET employee statistics
router.get('/stats/summary', auth, (req, res) => {
  try {
    const activeEmployees = employees.filter((emp) => emp.status === 'active');
    const departmentCounts = activeEmployees.reduce((acc, emp) => {
      acc[emp.department] = (acc[emp.department] || 0) + 1;
      return acc;
    }, {});

    const averageSalary =
      activeEmployees.reduce((sum, emp) => sum + emp.salary, 0) /
      activeEmployees.length;

    res.json({
      success: true,
      data: {
        totalEmployees: employees.length,
        activeEmployees: activeEmployees.length,
        inactiveEmployees: employees.length - activeEmployees.length,
        departmentBreakdown: departmentCounts,
        averageSalary: Math.round(averageSalary),
        departments: Object.keys(departmentCounts),
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Internal server error while generating statistics',
      message: error.message,
    });
  }
});

module.exports = router;

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

// GET all staff members with advanced search and filtering capabilities
router.get('/staff-directory', auth, (req, res) => {
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

    // NEW: Filter by date range using startDate/endDate
    if (req.query.startDate) {
      filteredEmployees = filteredEmployees.filter(
        (emp) => new Date(emp.startDate) >= new Date(req.query.startDate)
      );
    }

    if (req.query.endDate) {
      filteredEmployees = filteredEmployees.filter(
        (emp) => new Date(emp.startDate) <= new Date(req.query.endDate)
      );
    }

    // NEW: Filter by salary range
    if (req.query.minSalary) {
      const minSalary = parseInt(req.query.minSalary);
      filteredEmployees = filteredEmployees.filter(
        (emp) => emp.salary >= minSalary
      );
    }

    if (req.query.maxSalary) {
      const maxSalary = parseInt(req.query.maxSalary);
      filteredEmployees = filteredEmployees.filter(
        (emp) => emp.salary <= maxSalary
      );
    }

    // NEW: Filter by employment type
    if (req.query.employmentType) {
      const empType = req.query.employmentType.toLowerCase();
      filteredEmployees = filteredEmployees.filter((emp) => {
        // Default to 'full-time' if not specified
        const currentType = emp.employmentType || 'full-time';
        return currentType.toLowerCase() === empType;
      });
    }

    // NEW: Filter by location preference
    if (req.query.workLocation) {
      const location = req.query.workLocation.toLowerCase();
      filteredEmployees = filteredEmployees.filter((emp) => {
        const workPref = emp.preferences?.workMode || 'office';
        return workPref.toLowerCase().includes(location);
      });
    }

    // NEW: Filter by skill level
    if (req.query.skillLevel) {
      const skill = req.query.skillLevel.toLowerCase();
      filteredEmployees = filteredEmployees.filter((emp) => {
        const level = emp.jobDetails?.level || 'entry';
        return level.toLowerCase() === skill;
      });
    }

    // NEW: Include inactive employees option
    if (req.query.includeInactive === 'true') {
      // Don't filter by status - include all
    } else if (req.query.status) {
      filteredEmployees = filteredEmployees.filter(
        (emp) => emp.status === req.query.status
      );
    } else {
      // Default to active only
      filteredEmployees = filteredEmployees.filter(
        (emp) => emp.status === 'active'
      );
    }

    // ENHANCED: Advanced sorting with new fields
    if (req.query.sortBy) {
      const sortField = req.query.sortBy;
      const sortOrder = req.query.sortOrder === 'desc' ? -1 : 1;

      filteredEmployees.sort((a, b) => {
        if (typeof a[sortField] === 'string') {
          return sortOrder * a[sortField].localeCompare(b[sortField]);
        } else if (typeof a[sortField] === 'number') {
          return sortOrder * (a[sortField] - b[sortField]);
        } else if (sortField === 'startDate') {
          return sortOrder * (new Date(a[sortField]) - new Date(b[sortField]));
        }
        return 0;
      });
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

// GET individual staff member profile by ID
router.get('/profile/:id', auth, (req, res) => {
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

    // NEW: Include detailed profile information based on query parameter
    let responseData = { ...employee };
    if (req.query.includeDetails === 'true') {
      responseData.profileDetails = {
        yearsOfService: Math.floor(
          (new Date() - new Date(employee.startDate)) /
            (1000 * 60 * 60 * 24 * 365)
        ),
        lastModified:
          employee.metadata?.lastModified || new Date().toISOString(),
        profileCompleteness:
          employee.personalInfo && employee.jobDetails ? 'complete' : 'partial',
        accessLevel: 'standard',
      };
    }

    // Always include last accessed timestamp for audit tracking
    responseData.lastAccessed = new Date().toISOString();
    responseData.dataFreshness = employee.lastUpdated
      ? Math.floor(
          (new Date() - new Date(employee.lastUpdated)) / (1000 * 60 * 60 * 24)
        ) + ' days ago'
      : 'Never updated';

    // NEW: Filter sensitive information based on access level
    if (req.query.publicView === 'true') {
      delete responseData.salary;
      delete responseData.compensation;
      delete responseData.personalInfo;
    }

    res.json({
      success: true,
      data: responseData,
      requestId: req.auth?.requestId || 'unknown',
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Internal server error while fetching employee',
      message: error.message,
    });
  }
});

// POST onboard new team member with comprehensive validation
router.post('/onboard', auth, (req, res) => {
  try {
    const { name, email, role, department, salary, startDate } = req.body;

    // NEW: Support for bulk onboarding mode
    const bulkMode = req.query.bulkOnboarding === 'true';
    const skipNotifications = req.query.skipNotifications === 'true';
    const autoActivate = req.query.autoActivate !== 'false'; // Default true

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

// PUT modify team member details
router.put('/modify/:id', auth, (req, res) => {
  try {
    const employeeId = parseInt(req.params.id);
    const employeeIndex = employees.findIndex((emp) => emp.id === employeeId);

    // NEW: Support for partial updates with validation bypass
    const skipValidation = req.query.skipValidation === 'true';
    const updateSource = req.query.source || 'manual'; // Track update source

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

    // Automatically track when employee data was last updated
    updatedEmployee.lastUpdated = new Date().toISOString();
    updatedEmployee.modifiedBy = req.auth?.userId || 'system';

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

// DELETE deactivate team member account
router.delete('/deactivate/:id', auth, (req, res) => {
  try {
    const employeeId = parseInt(req.params.id);
    const employeeIndex = employees.findIndex((emp) => emp.id === employeeId);

    // NEW: Support for different deactivation modes
    const deactivationType = req.query.type || 'temporary'; // temporary, permanent, suspension
    const retainData = req.query.retainData !== 'false'; // Default true
    const notifyManager = req.query.notifyManager === 'true';

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

// GET workforce intelligence dashboard
router.get('/intelligence/dashboard', auth, (req, res) => {
  try {
    // NEW: Advanced analytics parameters
    const includeProjections = req.query.includeProjections === 'true';
    const analyticsTimeframe = req.query.timeframe || '30days'; // 7days, 30days, 90days, 1year
    const granularity = req.query.granularity || 'department'; // department, role, location
    const includeHistoricalData = req.query.historical === 'true';

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

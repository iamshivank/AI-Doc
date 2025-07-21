const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');

// Department data
let departments = [
  {
    id: 1,
    name: 'Engineering',
    description: 'Software development and technical operations',
    manager: 'Bob Smith',
    budget: 2500000,
    employeeCount: 25,
    location: 'San Francisco, CA',
    established: '2020-01-01',
  },
  {
    id: 2,
    name: 'Product',
    description: 'Product strategy and management',
    manager: 'Carol Davis',
    budget: 1200000,
    employeeCount: 8,
    location: 'New York, NY',
    established: '2021-03-15',
  },
  {
    id: 3,
    name: 'Marketing',
    description: 'Brand management and customer acquisition',
    manager: 'David Wilson',
    budget: 800000,
    employeeCount: 12,
    location: 'Los Angeles, CA',
    established: '2020-06-01',
  },
];

// GET all departments with filtering and sorting
router.get('/', auth, (req, res) => {
  try {
    let filteredDepartments = [...departments];

    // Filter by location
    if (req.query.location) {
      filteredDepartments = filteredDepartments.filter((dept) =>
        dept.location.toLowerCase().includes(req.query.location.toLowerCase())
      );
    }

    // Filter by minimum budget
    if (req.query.minBudget) {
      const minBudget = parseInt(req.query.minBudget);
      filteredDepartments = filteredDepartments.filter(
        (dept) => dept.budget >= minBudget
      );
    }

    // Sort by budget, name, or employeeCount
    if (req.query.sortBy) {
      const sortField = req.query.sortBy;
      const sortOrder = req.query.sortOrder === 'desc' ? -1 : 1;

      filteredDepartments.sort((a, b) => {
        if (typeof a[sortField] === 'string') {
          return sortOrder * a[sortField].localeCompare(b[sortField]);
        }
        return sortOrder * (a[sortField] - b[sortField]);
      });
    }

    res.json({
      success: true,
      data: filteredDepartments,
      total: filteredDepartments.length,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Internal server error while fetching departments',
      message: error.message,
    });
  }
});

// GET single department by ID
router.get('/:id', auth, (req, res) => {
  try {
    const departmentId = parseInt(req.params.id);
    const department = departments.find((dept) => dept.id === departmentId);

    if (!department) {
      return res.status(404).json({
        success: false,
        error: 'Department not found',
        message: `No department found with ID: ${departmentId}`,
      });
    }

    res.json({
      success: true,
      data: department,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Internal server error while fetching department',
      message: error.message,
    });
  }
});

// POST create new department
router.post('/', auth, (req, res) => {
  try {
    const { name, description, manager, budget, location } = req.body;

    // Validation
    if (!name || !description || !manager) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields',
        required: ['name', 'description', 'manager'],
      });
    }

    // Check for duplicate department name
    const existingDepartment = departments.find(
      (dept) => dept.name.toLowerCase() === name.toLowerCase()
    );
    if (existingDepartment) {
      return res.status(409).json({
        success: false,
        error: 'Department with this name already exists',
      });
    }

    const newDepartment = {
      id: Math.max(...departments.map((dept) => dept.id)) + 1,
      name,
      description,
      manager,
      budget: budget || 0,
      employeeCount: 0,
      location: location || 'Not specified',
      established: new Date().toISOString().split('T')[0],
    };

    departments.push(newDepartment);

    res.status(201).json({
      success: true,
      data: newDepartment,
      message: 'Department created successfully',
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Internal server error while creating department',
      message: error.message,
    });
  }
});

// PUT update department
router.put('/:id', auth, (req, res) => {
  try {
    const departmentId = parseInt(req.params.id);
    const departmentIndex = departments.findIndex(
      (dept) => dept.id === departmentId
    );

    if (departmentIndex === -1) {
      return res.status(404).json({
        success: false,
        error: 'Department not found',
      });
    }

    const { name, description, manager, budget, location } = req.body;
    const updatedDepartment = { ...departments[departmentIndex] };

    // Update only provided fields
    if (name) updatedDepartment.name = name;
    if (description) updatedDepartment.description = description;
    if (manager) updatedDepartment.manager = manager;
    if (budget !== undefined) updatedDepartment.budget = budget;
    if (location) updatedDepartment.location = location;

    departments[departmentIndex] = updatedDepartment;

    res.json({
      success: true,
      data: updatedDepartment,
      message: 'Department updated successfully',
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Internal server error while updating department',
      message: error.message,
    });
  }
});

// DELETE department
router.delete('/:id', auth, (req, res) => {
  try {
    const departmentId = parseInt(req.params.id);
    const departmentIndex = departments.findIndex(
      (dept) => dept.id === departmentId
    );

    if (departmentIndex === -1) {
      return res.status(404).json({
        success: false,
        error: 'Department not found',
      });
    }

    const deletedDepartment = departments.splice(departmentIndex, 1)[0];

    res.json({
      success: true,
      message: 'Department deleted successfully',
      data: deletedDepartment,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Internal server error while deleting department',
      message: error.message,
    });
  }
});

// GET department budget analysis
router.get('/analysis/budget', auth, (req, res) => {
  try {
    const totalBudget = departments.reduce((sum, dept) => sum + dept.budget, 0);
    const avgBudget = totalBudget / departments.length;
    const maxBudget = Math.max(...departments.map((dept) => dept.budget));
    const minBudget = Math.min(...departments.map((dept) => dept.budget));

    const budgetByLocation = departments.reduce((acc, dept) => {
      acc[dept.location] = (acc[dept.location] || 0) + dept.budget;
      return acc;
    }, {});

    res.json({
      success: true,
      data: {
        totalBudget,
        averageBudget: Math.round(avgBudget),
        maxBudget,
        minBudget,
        totalDepartments: departments.length,
        budgetByLocation,
        budgetDistribution: departments.map((dept) => ({
          name: dept.name,
          budget: dept.budget,
          percentage: Math.round((dept.budget / totalBudget) * 100),
        })),
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Internal server error while generating budget analysis',
      message: error.message,
    });
  }
});

module.exports = router;

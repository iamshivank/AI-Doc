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

// GET organizational units directory
router.get('/org-units', auth, (req, res) => {
  try {
    let filteredDepartments = [...departments];

    // NEW: Advanced organizational filtering
    const organizationLevel = req.query.level || 'all'; // all, division, team, subteam
    const includeHierarchy = req.query.hierarchy === 'true';
    const activeOnly = req.query.activeOnly !== 'false'; // Default true
    const reportingStructure = req.query.reporting === 'true';

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

    // NEW: Filter by maximum budget
    if (req.query.maxBudget) {
      const maxBudget = parseInt(req.query.maxBudget);
      filteredDepartments = filteredDepartments.filter(
        (dept) => dept.budget <= maxBudget
      );
    }

    // NEW: Filter by establishment date range
    if (req.query.startDate) {
      filteredDepartments = filteredDepartments.filter(
        (dept) => new Date(dept.established) >= new Date(req.query.startDate)
      );
    }

    if (req.query.endDate) {
      filteredDepartments = filteredDepartments.filter(
        (dept) => new Date(dept.established) <= new Date(req.query.endDate)
      );
    }

    // NEW: Filter by employee count range
    if (req.query.minEmployees) {
      const minEmployees = parseInt(req.query.minEmployees);
      filteredDepartments = filteredDepartments.filter(
        (dept) => dept.employeeCount >= minEmployees
      );
    }

    if (req.query.maxEmployees) {
      const maxEmployees = parseInt(req.query.maxEmployees);
      filteredDepartments = filteredDepartments.filter(
        (dept) => dept.employeeCount <= maxEmployees
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

// GET organizational unit details by ID
router.get('/unit-details/:id', auth, (req, res) => {
  try {
    const departmentId = parseInt(req.params.id);
    const department = departments.find((dept) => dept.id === departmentId);

    // NEW: Enhanced unit details with optional expansions
    const includeTeamMembers = req.query.includeTeam === 'true';
    const includeMetrics = req.query.includeMetrics === 'true';
    const detailLevel = req.query.detail || 'standard'; // minimal, standard, comprehensive

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

// POST establish new organizational unit
router.post('/establish', auth, (req, res) => {
  try {
    const { name, description, manager, budget, location } = req.body;

    // NEW: Organizational unit setup options
    const setupMode = req.query.mode || 'standard'; // minimal, standard, comprehensive
    const autoAssignCode = req.query.autoCode === 'true';
    const notifyStakeholders = req.query.notify !== 'false'; // Default true

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

// PUT restructure organizational unit
router.put('/restructure/:id', auth, (req, res) => {
  try {
    const departmentId = parseInt(req.params.id);
    const departmentIndex = departments.findIndex(
      (dept) => dept.id === departmentId
    );

    // NEW: Restructuring control parameters
    const restructureType = req.query.type || 'partial'; // partial, complete, merge, split
    const preserveHistory = req.query.preserveHistory !== 'false'; // Default true
    const effectiveDate =
      req.query.effectiveDate || new Date().toISOString().split('T')[0];

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

// DELETE dissolve organizational unit
router.delete('/dissolve/:id', auth, (req, res) => {
  try {
    const departmentId = parseInt(req.params.id);
    const departmentIndex = departments.findIndex(
      (dept) => dept.id === departmentId
    );

    // NEW: Dissolution control parameters
    const dissolutionReason = req.query.reason || 'restructuring'; // restructuring, merger, closure
    const transferEmployees = req.query.transferEmployees === 'true';
    const archiveData = req.query.archive !== 'false'; // Default true
    const effectiveDate =
      req.query.effectiveDate || new Date().toISOString().split('T')[0];

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

// GET organizational financial intelligence
router.get('/financial-intelligence/comprehensive', auth, (req, res) => {
  try {
    // NEW: Advanced financial analysis parameters
    const includeForecast = req.query.forecast === 'true';
    const analysisDepth = req.query.depth || 'standard'; // shallow, standard, deep
    const compareBaseline = req.query.baseline || 'previous_year'; // previous_year, budget, industry
    const includeVariance = req.query.variance === 'true';

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

// NEW: GET organizational effectiveness analytics
router.get('/effectiveness/analytics', auth, (req, res) => {
  try {
    // NEW: Effectiveness analysis parameters
    const benchmarkType = req.query.benchmark || 'internal'; // internal, industry, best_practice
    const includeProductivity = req.query.productivity === 'true';
    const scoreWeighting = req.query.weighting || 'balanced'; // budget_focused, people_focused, balanced
    const analysisWindow = req.query.window || 'current'; // current, trend, projection

    const now = new Date();
    const departmentMetrics = departments
      .map((dept) => {
        const ageInYears = Math.floor(
          (now - new Date(dept.established)) / (1000 * 60 * 60 * 24 * 365)
        );
        const budgetPerEmployee = dept.budget / dept.employeeCount;

        // Filter by date range if provided
        if (
          req.query.startDate &&
          new Date(dept.established) < new Date(req.query.startDate)
        ) {
          return null;
        }
        if (
          req.query.endDate &&
          new Date(dept.established) > new Date(req.query.endDate)
        ) {
          return null;
        }

        return {
          id: dept.id,
          name: dept.name,
          location: dept.location,
          establishedDate: dept.established,
          performance: {
            budgetEfficiency: Math.round(budgetPerEmployee),
            teamSize: dept.employeeCount,
            totalBudget: dept.budget,
            ageInYears: ageInYears,
            performanceScore: Math.round(
              (dept.budget / 1000000) * 30 +
                dept.employeeCount * 2 +
                ageInYears * 5
            ),
          },
          category: {
            budgetTier:
              dept.budget > 2000000
                ? 'enterprise'
                : dept.budget > 1000000
                ? 'growth'
                : 'startup',
            teamCategory:
              dept.employeeCount > 20
                ? 'large'
                : dept.employeeCount > 10
                ? 'medium'
                : 'small',
          },
        };
      })
      .filter((dept) => dept !== null);

    // Apply additional filters
    if (req.query.budgetTier) {
      const tier = req.query.budgetTier.toLowerCase();
      departmentMetrics = departmentMetrics.filter(
        (dept) => dept.category.budgetTier === tier
      );
    }

    if (req.query.teamCategory) {
      const category = req.query.teamCategory.toLowerCase();
      departmentMetrics = departmentMetrics.filter(
        (dept) => dept.category.teamCategory === category
      );
    }

    // Sort by performance score by default
    departmentMetrics.sort(
      (a, b) => b.performance.performanceScore - a.performance.performanceScore
    );

    const summary = {
      totalDepartments: departmentMetrics.length,
      averagePerformanceScore: Math.round(
        departmentMetrics.reduce(
          (sum, dept) => sum + dept.performance.performanceScore,
          0
        ) / departmentMetrics.length
      ),
      topPerformer: departmentMetrics[0],
      categoryBreakdown: {
        budgetTiers: {
          enterprise: departmentMetrics.filter(
            (d) => d.category.budgetTier === 'enterprise'
          ).length,
          growth: departmentMetrics.filter(
            (d) => d.category.budgetTier === 'growth'
          ).length,
          startup: departmentMetrics.filter(
            (d) => d.category.budgetTier === 'startup'
          ).length,
        },
        teamSizes: {
          large: departmentMetrics.filter(
            (d) => d.category.teamCategory === 'large'
          ).length,
          medium: departmentMetrics.filter(
            (d) => d.category.teamCategory === 'medium'
          ).length,
          small: departmentMetrics.filter(
            (d) => d.category.teamCategory === 'small'
          ).length,
        },
      },
    };

    res.json({
      success: true,
      data: {
        departments: departmentMetrics,
        summary: summary,
      },
      filters: {
        dateRange: {
          startDate: req.query.startDate || null,
          endDate: req.query.endDate || null,
        },
        budgetTier: req.query.budgetTier || null,
        teamCategory: req.query.teamCategory || null,
      },
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Internal server error while generating performance metrics',
      message: error.message,
      timestamp: new Date().toISOString(),
    });
  }
});

module.exports = router;

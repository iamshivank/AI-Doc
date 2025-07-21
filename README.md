# 🚀 Enterprise API - Advanced Employee & Department Management

A comprehensive RESTful API for managing employees and departments with advanced filtering, sorting, and analytics capabilities.

## 📋 Table of Contents

- [Features](#features)
- [Quick Start](#quick-start)
- [API Documentation](#api-documentation)
- [Testing with Postman](#testing-with-postman)
- [Environment Variables](#environment-variables)
- [Query Parameters](#query-parameters)
- [Response Formats](#response-formats)

## ✨ Features

- **Employee Management**: Full CRUD operations with advanced filtering
- **Department Analytics**: Budget analysis and performance metrics
- **Date Range Filtering**: Filter by hire dates, establishment dates
- **Advanced Sorting**: Multi-field sorting capabilities
- **Pagination**: Efficient data pagination
- **Authentication**: API key-based security
- **Rate Limiting**: Built-in request rate limiting
- **Comprehensive Logging**: Request tracking and monitoring

## 🚀 Quick Start

### Prerequisites

- Node.js (v14 or higher)
- npm or yarn
- Git

### Installation

1. **Clone the repository**

   ```bash
   git clone https://github.com/iamshivank/AI-Doc.git
   cd api
   ```

2. **Install dependencies**

   ```bash
   npm install
   ```

3. **Set up environment variables**

   ```bash
   # Create .env file
   echo "API_KEY=your-secret-api-key-123" > .env
   echo "PORT=3000" >> .env
   echo "NODE_ENV=development" >> .env
   ```

4. **Start the server**

   ```bash
   # Development mode
   npm run dev

   # Production mode
   npm start
   ```

5. **Verify installation**
   ```bash
   curl http://localhost:3000/health
   ```

### Expected Response

```json
{
  "status": "UP",
  "service": "Enterprise API",
  "version": "2.0.0",
  "timestamp": "2024-01-15T10:30:45.123Z",
  "uptime": {
    "seconds": 120,
    "human": "0h 2m 0s"
  },
  "memory": {
    "used": "25MB",
    "total": "50MB",
    "external": "5MB"
  },
  "environment": "development",
  "nodeVersion": "v18.17.0"
}
```

## 📚 API Documentation

### Base URL

```
http://localhost:3000
```

### Authentication

All API endpoints require an API key in the header:

```
x-api-key: your-secret-api-key-123
```

### 👥 Employee Endpoints

| Method | Endpoint                            | Description                       |
| ------ | ----------------------------------- | --------------------------------- |
| GET    | `/api/employees`                    | List all employees with filtering |
| GET    | `/api/employees/{id}`               | Get single employee               |
| POST   | `/api/employees`                    | Create new employee               |
| PUT    | `/api/employees/{id}`               | Update employee                   |
| DELETE | `/api/employees/{id}`               | Soft delete employee              |
| GET    | `/api/employees/analytics/overview` | Employee analytics                |

### 🏢 Department Endpoints

| Method | Endpoint                                   | Description                         |
| ------ | ------------------------------------------ | ----------------------------------- |
| GET    | `/api/departments`                         | List all departments with filtering |
| GET    | `/api/departments/{id}`                    | Get single department               |
| POST   | `/api/departments`                         | Create new department               |
| PUT    | `/api/departments/{id}`                    | Update department                   |
| DELETE | `/api/departments/{id}`                    | Delete department                   |
| GET    | `/api/departments/finance/budget-analysis` | Budget analysis                     |
| GET    | `/api/departments/metrics/performance`     | Performance metrics                 |

## 🧪 Testing with Postman

### Setup Postman Environment

1. **Create new Environment in Postman**

   - Name: `Enterprise API Local`
   - Variables:
     ```
     base_url: http://localhost:3000
     api_key: your-secret-api-key-123
     ```

2. **Import Collection**

   Create a new collection with these pre-configured requests:

### 📝 Sample Postman Requests

#### 1. Health Check

```http
GET {{base_url}}/health
```

#### 2. Get All Employees (Basic)

```http
GET {{base_url}}/api/employees
Headers:
x-api-key: {{api_key}}
```

#### 3. Get Employees with Date Filtering

```http
GET {{base_url}}/api/employees?startDate=2022-01-01&endDate=2023-12-31&sortBy=startDate&sortOrder=desc
Headers:
x-api-key: {{api_key}}
```

#### 4. Get Employees with Salary Range

```http
GET {{base_url}}/api/employees?minSalary=80000&maxSalary=150000&department=Engineering
Headers:
x-api-key: {{api_key}}
```

#### 5. Create New Employee

```http
POST {{base_url}}/api/employees
Headers:
x-api-key: {{api_key}}
Content-Type: application/json

Body:
{
  "name": "John Doe",
  "email": "john.doe@company.com",
  "role": "Senior Developer",
  "department": "Engineering",
  "salary": 95000,
  "startDate": "2024-01-15",
  "status": "active"
}
```

#### 6. Get Departments with Budget Filtering

```http
GET {{base_url}}/api/departments?minBudget=1000000&maxBudget=3000000&sortBy=budget&sortOrder=desc
Headers:
x-api-key: {{api_key}}
```

#### 7. Get Department Performance Metrics

```http
GET {{base_url}}/api/departments/metrics/performance?startDate=2020-01-01&budgetTier=enterprise
Headers:
x-api-key: {{api_key}}
```

#### 8. Get Department Budget Analysis

```http
GET {{base_url}}/api/departments/finance/budget-analysis
Headers:
x-api-key: {{api_key}}
```

#### 9. Get Employee Analytics

```http
GET {{base_url}}/api/employees/analytics/overview
Headers:
x-api-key: {{api_key}}
```

### 📊 Postman Test Scripts

Add these test scripts to validate responses:

#### Basic Response Validation

```javascript
pm.test('Status code is 200', function () {
  pm.response.to.have.status(200);
});

pm.test('Response has success field', function () {
  const responseJson = pm.response.json();
  pm.expect(responseJson).to.have.property('success');
  pm.expect(responseJson.success).to.be.true;
});

pm.test('Response has data', function () {
  const responseJson = pm.response.json();
  pm.expect(responseJson).to.have.property('data');
});
```

#### Date Filtering Validation

```javascript
pm.test('Filtered results respect date range', function () {
  const responseJson = pm.response.json();
  const startDate = new Date('2022-01-01');
  const endDate = new Date('2023-12-31');

  responseJson.data.forEach(function (employee) {
    const employeeDate = new Date(employee.startDate);
    pm.expect(employeeDate >= startDate).to.be.true;
    pm.expect(employeeDate <= endDate).to.be.true;
  });
});
```

## 🔧 Environment Variables

Create a `.env` file in the project root:

```env
# Required
API_KEY=your-secret-api-key-123

# Optional
PORT=3000
NODE_ENV=development
ALLOWED_ORIGINS=http://localhost:3000,http://localhost:3001
```

## 📊 Query Parameters

### Employee Endpoints

| Parameter    | Type   | Description                             | Example                   |
| ------------ | ------ | --------------------------------------- | ------------------------- |
| `search`     | string | Search in name, email, role, department | `?search=john`            |
| `department` | string | Filter by department                    | `?department=Engineering` |
| `status`     | string | Filter by status (active/inactive)      | `?status=active`          |
| `startDate`  | date   | Filter by hire start date               | `?startDate=2022-01-01`   |
| `endDate`    | date   | Filter by hire end date                 | `?endDate=2023-12-31`     |
| `minSalary`  | number | Minimum salary filter                   | `?minSalary=50000`        |
| `maxSalary`  | number | Maximum salary filter                   | `?maxSalary=150000`       |
| `sortBy`     | string | Sort field (name, salary, startDate)    | `?sortBy=salary`          |
| `sortOrder`  | string | Sort order (asc, desc)                  | `?sortOrder=desc`         |
| `page`       | number | Page number for pagination              | `?page=2`                 |
| `limit`      | number | Items per page                          | `?limit=20`               |

### Department Endpoints

| Parameter      | Type   | Description                             | Example                  |
| -------------- | ------ | --------------------------------------- | ------------------------ |
| `location`     | string | Filter by location                      | `?location=California`   |
| `minBudget`    | number | Minimum budget filter                   | `?minBudget=1000000`     |
| `maxBudget`    | number | Maximum budget filter                   | `?maxBudget=5000000`     |
| `startDate`    | date   | Filter by establishment start date      | `?startDate=2020-01-01`  |
| `endDate`      | date   | Filter by establishment end date        | `?endDate=2023-12-31`    |
| `minEmployees` | number | Minimum employee count                  | `?minEmployees=10`       |
| `maxEmployees` | number | Maximum employee count                  | `?maxEmployees=50`       |
| `budgetTier`   | string | Budget tier (enterprise/growth/startup) | `?budgetTier=enterprise` |
| `teamCategory` | string | Team size (large/medium/small)          | `?teamCategory=large`    |

## 📋 Response Formats

### Success Response

```json
{
  "success": true,
  "data": [...],
  "pagination": {
    "currentPage": 1,
    "totalPages": 5,
    "totalEmployees": 50,
    "hasNext": true,
    "hasPrev": false
  }
}
```

### Error Response

```json
{
  "success": false,
  "error": "Validation Error",
  "message": "Missing required fields",
  "required": ["name", "email", "role", "department"]
}
```

## 🛠️ Development Commands

```bash
# Start development server with auto-reload
npm run dev

# Start production server
npm start

# Run tests (if available)
npm test

# Check code syntax
npm run lint
```

## 🔍 Testing Examples

### Test Date Range Filtering

```bash
# Get employees hired in 2022
curl -H "x-api-key: your-secret-api-key-123" \
  "http://localhost:3000/api/employees?startDate=2022-01-01&endDate=2022-12-31"

# Get departments established after 2020
curl -H "x-api-key: your-secret-api-key-123" \
  "http://localhost:3000/api/departments?startDate=2020-01-01"
```

### Test Salary Filtering

```bash
# Get high-salary employees
curl -H "x-api-key: your-secret-api-key-123" \
  "http://localhost:3000/api/employees?minSalary=100000"
```

### Test Sorting

```bash
# Get employees sorted by salary (highest first)
curl -H "x-api-key: your-secret-api-key-123" \
  "http://localhost:3000/api/employees?sortBy=salary&sortOrder=desc"
```

## 🚨 Common Issues & Solutions

### Issue: "Invalid API Key"

**Solution**: Ensure you've set the `API_KEY` environment variable and are passing it correctly in the `x-api-key` header.

### Issue: "Port already in use"

**Solution**: Change the PORT in your `.env` file or stop the process using port 3000.

### Issue: "Date filtering not working"

**Solution**: Ensure dates are in YYYY-MM-DD format.

## 📞 Support

For issues and questions:

- Create an issue in the GitHub repository
- Check the API documentation at `http://localhost:3000/`
- Review the server logs for detailed error messages

## 📄 License

This project is licensed under the MIT License.

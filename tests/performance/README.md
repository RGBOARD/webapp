# RGBOARD Performance Testing

This directory contains load testing and performance testing tools for the RGBOARD application using Locust.

## Directory Structure

```txt
performance/
├── behaviors/                  # User behavior modules
│   ├── __init__.py
│   ├── admin_user_behavior.py  # Admin-specific tasks
│   ├── regular_user_behavior.py  # Regular user tasks
│   └── user_behavior.py        # Base user behavior
├── docs/
│   └── performance_analysis_guide.md  # Guide to analyze results
├── locust_scripts/             # Locust test scripts
│   ├── locustfile.py           # Main test script
│   ├── locustfile_config.py    # Test configuration and setup
│   ├── locustfile_db_focus.py  # DB-intensive testing script
│   └── test_data_setup.py      # Data setup utility
└── results/                    # Test results (not in version control)
    ├── baseline/               # Baseline test results
    ├── high_concurrency/       # High concurrency test results 
    ├── stability/              # Stability test results
    └── visualizations/         # Generated charts and graphs
```

## Prerequisites

1. Python 3.7+
2. Required packages:

   ```txt
   locust>=2.12.1
   matplotlib>=3.5.0
   pandas>=1.3.5
   seaborn>=0.11.2
   ```

Install dependencies with:

```bash
pip install locust matplotlib pandas seaborn
```

## Quick Start

1. **Setup test data**:

   ```bash
   python tests/performance/locust_scripts/test_data_setup.py --db test_data.db
   ```

2. **Start the Flask server** (in a separate terminal):

   ```bash
   python app.py --db test_data.db
   ```

3. **Run Locust** (in a separate terminal):

   ```bash
   locust -f tests/performance/locust_scripts/locustfile.py --host=http://localhost:5000
   ```

4. **Access the Locust web interface**:
   Open your browser and go to <http://localhost:8089>

## Test Scenarios

The testing suite includes several pre-configured scenarios targeting different aspects of the application:

### 1. Baseline Testing

Establishes baseline performance under normal load:

```bash
locust -f tests/performance/locust_scripts/locustfile.py --host=http://localhost:5000 --headless -u 20 -r 2 -t 5m --csv=tests/performance/results/baseline/baseline
```

### 2. High Concurrency Testing

Tests application performance under high user load:

```bash
locust -f tests/performance/locust_scripts/locustfile.py --host=http://localhost:5000 --headless -u 100 -r 5 -t 10m --csv=tests/performance/results/high_concurrency/high_concurrency
```

### 3. Stability Testing

Verifies application stability over an extended period:

```bash
locust -f tests/performance/locust_scripts/locustfile.py --host=http://localhost:5000 --headless -u 50 -r 2 -t 30m --csv=tests/performance/results/stability/stability
```

### 4. Database-Focused Testing

Targets database performance, particularly the rotation system:

```bash
locust -f tests/performance/locust_scripts/locustfile_db_focus.py --host=http://localhost:5000 --headless -u 30 -r 3 -t 15m --csv=tests/performance/results/db_operations/db_operations
```

## Analyzing Results

For detailed analysis instructions, refer to `docs/performance_analysis_guide.md`.

## Customizing Tests

To modify the test behavior:

1. Edit user behaviors in the `behaviors/` directory
2. Create custom scenario files like `locustfile_db_focus.py`
3. Adjust test parameters in the scripts themselves

## Troubleshooting

- **Connection errors**: Make sure the Flask server is running
- **Authentication failures**: Check that the test setup script was successful
- **Database errors**: Verify the database path is correct in test_data_setup.py
- **Missing directories**: Create any missing directories in the results path

## Contribution

When adding new tests:

1. Create behavior modules in the `behaviors/` directory
2. Create test scripts in the `locust_scripts/` directory
3. Update this README with any new test scenarios
4. Make sure new tests follow the established patterns for consistency

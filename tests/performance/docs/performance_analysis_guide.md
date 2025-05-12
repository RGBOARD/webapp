# RGBOARD Performance Analysis Guide

This guide provides instructions on how to analyze the Locust test results and interpret the performance metrics for RGBOARD.

## Running the Tests

1. **Setup the test environment**:

   ```bash
   # Setup test data
   python tests/performance/locust_scripts/test_data_setup.py --db test_data.db
   
   # Start the Flask application
   python app.py --db test_data.db
   
   # In a separate terminal, run Locust
   locust -f tests/performance/locust_scripts/locustfile.py --host=http://localhost:5000
   ```

2. **Access the Locust web interface**:
   - Open your browser and go to <http://localhost:8089>
   - Configure the test parameters:
     - Number of users
     - Spawn rate (users per second)
     - Host URL (should be pre-populated)

3. **Execute the test scenarios** from the `locustfile_config.py` file.

## Analyzing Results

### Key Metrics to Monitor

1. **Response Time**
   - **Median**: The 50th percentile response time. A good indicator of typical performance.
   - **95th Percentile**: Indicates the experience of the slowest 5% of requests. Should not be significantly higher than the median.
   - **99th Percentile**: Useful for identifying outliers and worst-case scenarios.

2. **Requests Per Second (RPS)**
   - The throughput of your application. Higher is better, but look for stability.
   - Monitor how RPS changes as user count increases.

3. **Failure Rate**
   - Percentage of failed requests. Should ideally be close to 0%.
   - Investigate any endpoint with failures > 0%.

4. **Number of Users**
   - The actual number of users simulated during the test.
   - Compare performance metrics at different user levels.

### Endpoint-Specific Analysis

For each endpoint, examine:

1. **Response Time Distribution**
   - Which endpoints are slowest?
   - Is there a pattern to slow requests? (e.g., authentication, data retrieval, database writes)

2. **Failure Patterns**
   - Are failures concentrated on specific endpoints?
   - Do failures increase under higher load?

3. **Request Frequency**
   - Identify the most frequently called endpoints.
   - Are high-frequency endpoints optimized?

## Performance Bottleneck Identification

### Common Bottlenecks

1. **Database Issues**
   - Look for slow response times on endpoints that involve:
     - `/design` operations (creation, retrieval)
     - `/rotation` operations (especially reordering)
     - `/user` retrieval with pagination

2. **Authentication Overhead**
   - Monitor the performance of endpoints that require JWT verification.
   - Check if token verification becomes a bottleneck under load.

3. **Background Scheduler**
   - Watch for performance degradation when many items are in the rotation queue.
   - Check if `check_rotation()` function causes contention issues.

4. **SQLite Limitations**
   - SQLite performs poorly with high concurrent write operations.
   - Look for failures or timeouts in scenarios with many simultaneous writes.

## Optimizing Your Application

Based on performance testing results, consider these optimization strategies:

### Database Optimization

1. **Indexing**
   - Add indexes to frequently queried columns
   - Example:

     ```sql
     CREATE INDEX idx_rotation_queue_order ON rotation_queue(display_order);
     CREATE INDEX idx_design_user_id ON design(user_id);
     ```

2. **Connection Pooling**
   - Implement connection pooling to reduce the overhead of creating database connections
   - Consider using a connection pooling library if you move beyond SQLite

3. **Query Optimization**
   - Review and optimize complex queries, especially those involving JOINs
   - Consider denormalizing some data for faster reads

### API Optimization

1. **Pagination**
   - Ensure all list endpoints use pagination with reasonable page sizes
   - Limit maximum page size to prevent huge query results

2. **Response Size Reduction**
   - Return only necessary data
   - Consider implementing field selection mechanisms

3. **Caching**
   - Implement caching for frequently accessed, relatively static data:
     - Current rotation image
     - Approved designs list
     - User profile information

### Authentication Optimization

1. **Token TTL**
   - Adjust token expiration time based on security requirements
   - Consider shorter-lived tokens with refresh mechanism

2. **Verification Overhead**
   - Optimize JWT verification process
   - Consider caching token verification results briefly

## Scaling Strategies

If your application needs to scale beyond what SQLite can handle:

1. **Database Migration**
   - Consider migrating from SQLite to PostgreSQL or MySQL for better concurrency
   - Implement proper indexing and query optimization during migration

2. **Application Architecture**
   - Split the application into microservices if specific components become bottlenecks
   - Consider separating read and write operations

3. **Background Processing**
   - Move heavy operations to background tasks
   - Implement a message queue for processing image uploads and rotations

## Reporting Template

Use this template to document your performance test results:

```md
# RGBOARD Performance Test Report

## Test Configuration
- Date: [Test Date]
- Test Duration: [Duration]
- Users: [Number of users]
- Spawn Rate: [Users per second]
- Test Scenario: [Scenario name]

## Overall Results
- Average RPS: [Requests per second]
- Median Response Time: [Time in ms]
- 95th Percentile: [Time in ms]
- Failure Rate: [Percentage]

## Endpoint Performance (Top 5 slowest)
1. [Endpoint] - [Median time] ms
2. [Endpoint] - [Median time] ms
3. [Endpoint] - [Median time] ms
4. [Endpoint] - [Median time] ms
5. [Endpoint] - [Median time] ms

## Failures
- [Endpoint]: [Count] failures - [Reason]
- [Endpoint]: [Count] failures - [Reason]

## Bottlenecks Identified
- [Description of bottleneck 1]
- [Description of bottleneck 2]

## Recommendations
- [Recommendation 1]
- [Recommendation 2]
- [Recommendation 3]
```

## Visualizing Results

Locust generates CSV files that can be analyzed using data visualization tools. The following is a Python script to create visualizations from these files:

```python
import pandas as pd
import matplotlib.pyplot as plt
import seaborn as sns

# Load the results
stats = pd.read_csv('tests/performance/results/baseline/baseline_stats.csv')
history = pd.read_csv('tests/performance/results/baseline/baseline_stats_history.csv') 

# Plot response times over time
plt.figure(figsize=(12, 6))
plt.plot(history['timestamp'], history['median_response_time'], label='Median')
plt.plot(history['timestamp'], history['95%_response_time'], label='95th Percentile')
plt.title('Response Time Over Time')
plt.xlabel('Time')
plt.ylabel('Response Time (ms)')
plt.legend()
plt.savefig('tests/performance/results/visualizations/response_time_over_time.png')

# Plot requests per second
plt.figure(figsize=(12, 6))
plt.plot(history['timestamp'], history['current_rps'])
plt.title('Requests Per Second')
plt.xlabel('Time')
plt.ylabel('Requests/sec')
plt.savefig('tests/performance/results/visualizations/requests_per_second.png')

# Plot endpoint performance comparison
endpoints = stats['Name'].values
median_times = stats['Median Response Time'].values

plt.figure(figsize=(14, 8))
sns.barplot(x=median_times, y=endpoints)
plt.title('Endpoint Performance Comparison')
plt.xlabel('Median Response Time (ms)')
plt.tight_layout()
plt.savefig('tests/performance/results/visualizations/endpoint_performance.png')
```

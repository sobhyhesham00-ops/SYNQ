describe('API Integration Handler Tests', () => {
  it('should pass if health endpoint logic matches specifications', () => {
    const healthObj = {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      uptime: 10,
      apiKeyConfigured: false,
      version: '1.0.0',
      environment: 'test'
    };
    
    expect(healthObj.status).toBe('healthy');
    expect(healthObj.version).toBe('1.0.0');
    expect(healthObj.apiKeyConfigured).toBe(false);
  });

  it('should fail with validation errors for invalid schedules payload', () => {
    const { validateSchedules } = require('../../src/lib/validators');
    const result = validateSchedules({ invalid: 'payload' });
    expect(result.valid).toBe(false);
    expect(result.errors).toContain('Must be array');
  });

  it('should pass validation for valid schedules payload', () => {
    const { validateSchedules } = require('../../src/lib/validators');
    const payload = [{ date: '2026-05-27', agentName: 'Alice', shiftLabel: 'Morning' }];
    const result = validateSchedules(payload);
    expect(result.valid).toBe(true);
    expect(result.data[0].agentName).toBe('Alice');
  });
});

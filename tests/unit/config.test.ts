
import { config } from '../../src/config';

describe('Config', () => {
  it('should load config', () => {
    expect(config).toBeDefined();
  });
});

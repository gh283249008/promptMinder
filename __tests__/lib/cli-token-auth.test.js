import { extractBearerToken, hashCliToken } from '../../lib/cli-token-auth';

describe('cli token auth helpers', () => {
  test('应该正确提取 Bearer token', () => {
    const request = {
      headers: {
        get(name) {
          if (name.toLowerCase() === 'authorization') {
            return 'Bearer pm_example_token';
          }
          return null;
        },
      },
    };

    expect(extractBearerToken(request)).toBe('pm_example_token');
  });

  test('应该在缺少 Bearer 头时返回 null', () => {
    const request = {
      headers: {
        get() {
          return null;
        },
      },
    };

    expect(extractBearerToken(request)).toBeNull();
  });

  test('应该稳定生成 token hash', () => {
    expect(hashCliToken('pm_same_token')).toBe(hashCliToken('pm_same_token'));
    expect(hashCliToken('pm_same_token')).not.toBe(hashCliToken('pm_other_token'));
  });
});

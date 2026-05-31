export class MediaWikiError extends Error {
  constructor(message: string, public readonly code?: string) {
    super(message);
    this.name = 'MediaWikiError';
  }
}

export class AuthError extends MediaWikiError {
  constructor(message: string) {
    super(message, 'auth_error');
    this.name = 'AuthError';
  }
}

export class ApiError extends MediaWikiError {
  constructor(message: string, public readonly statusCode?: number) {
    super(message, 'api_error');
    this.name = 'ApiError';
  }
}

export class ConfigError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ConfigError';
  }
}

export class ParameterCorruptedError extends Error {
  constructor(paramName: string, value: string) {
    super(
      `参数 "${paramName}" 的值 "${value}" 疑似被模板引擎污染（{{...}} 被误解析为模板变量）。` +
      `请避免在参数值中使用 {{ 和 }} 模式，改用其他方式表达。`
    );
    this.name = 'ParameterCorruptedError';
  }
}

export class BrowserError extends Error {
  constructor(message: string, public readonly url?: string) {
    super(message);
    this.name = 'BrowserError';
  }
}

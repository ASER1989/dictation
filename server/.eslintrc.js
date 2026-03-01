module.exports = {
  root: true,
  parser: '@typescript-eslint/parser', // 使用 TypeScript 的解析器
  parserOptions: {
    ecmaVersion: 2020, // 支持现代 ES 语法
    sourceType: 'module',
    project: './tsconfig.json', // 必须指向 tsconfig
  },
  env: {
    node: true,
    es2020: true,
  },
  plugins: ['@typescript-eslint', 'prettier'],
  extends: [
    'eslint:recommended',
    'plugin:@typescript-eslint/recommended', // TypeScript 推荐规则
    'plugin:prettier/recommended', // 启用 eslint-plugin-prettier 和 eslint-config-prettier
  ],
  rules: {
    // 可根据团队风格自定义规则
    'prettier/prettier': 'error',
    '@typescript-eslint/no-explicit-any': 'off',
    '@typescript-eslint/explicit-module-boundary-types': 'off',
    '@typescript-eslint/no-unused-vars': ['warn', { argsIgnorePattern: '^_' }],
  },
  ignorePatterns: ['dist/', 'node_modules/', '*.js'], // 忽略构建产物
};

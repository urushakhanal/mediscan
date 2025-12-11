// ESLint 9+ Flat Config Format for React
const js = require('@eslint/js');
const globals = require('globals');
const reactPlugin = require('eslint-plugin-react');

module.exports = [
    js.configs.recommended,
    {
        files: ['**/*.{js,jsx}'],
        languageOptions: {
            ecmaVersion: 'latest',
            sourceType: 'module',
            parserOptions: {
                ecmaFeatures: {
                    jsx: true,
                },
            },
            globals: {
                ...globals.browser,
                ...globals.es2021,
            },
        },
        plugins: {
            react: reactPlugin,
        },
        rules: {
            ...reactPlugin.configs.recommended.rules,
            'react/react-in-jsx-scope': 'off', // Not needed in React 17+
            'react/prop-types': 'off', // Using JSDoc instead
            'no-unused-vars': ['warn', { argsIgnorePattern: '^_' }],
        },
        settings: {
            react: {
                version: 'detect',
            },
        },
    },
];

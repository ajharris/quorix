import fetchMock from 'jest-fetch-mock';
fetchMock.enableMocks();

import '@testing-library/jest-dom';

// Polyfill timer functions for test environment
if (typeof setInterval === 'undefined') global.setInterval = function () {};
if (typeof clearInterval === 'undefined') global.clearInterval = function () {};

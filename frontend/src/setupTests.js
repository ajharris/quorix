import fetchMock from 'jest-fetch-mock';
fetchMock.enableMocks();

// Polyfill timer functions for test environment
if (typeof setInterval === 'undefined') global.setInterval = function () {};
if (typeof clearInterval === 'undefined') global.clearInterval = function () {};

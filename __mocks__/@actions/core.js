import { jest } from '@jest/globals';

export function getInput() {
  return '5269636b204173746c6579202d204e6576657220676f6e6e65206769766520796f75207570';
}

export const debug = jest.fn().mockName('core.debug');
export const info = jest.fn().mockName('core.info');
export const setOutput = jest.fn().mockName('core.setOutput');
export const warning = jest.fn().mockName('core.warning');

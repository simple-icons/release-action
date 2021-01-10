module.exports = {
  getInput: function (_, __) {
    return '5269636b204173746c6579202d204e6576657220676f6e6e65206769766520796f75207570';
  },

  debug: jest.fn().mockName('core.debug'),
  info: jest.fn().mockName('core.info'),
  warning: jest.fn().mockName('core.warning'),
};

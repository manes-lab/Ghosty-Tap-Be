const BN = require("bn.js")
const config = require('config')
const crypto = require('crypto');

function hmacSha256(data, secret) {
  return crypto.createHmac('sha256', secret)
    .update(data)
    .digest('hex');
}

function generateUniqueRandomArray(length, max) {
  const set = new Set();
  while (set.size < length) {
    set.add(Math.floor(Math.random() * max) + 1);
  }
  return Array.from(set);
}

function getRandomInt(min, max) {
  min = Math.ceil(min);
  max = Math.floor(max);
  return Math.floor(Math.random() * (max - min + 1)) + min;
}
function generateCaptcha(length) {
  const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let captcha = '';
  for (let i = 0; i < length; i++) {
    const randomIndex = Math.floor(Math.random() * characters.length);
    captcha += characters[randomIndex];
  }
  return captcha;
}

module.exports = {
  hmacSha256,
  generateUniqueRandomArray,
  getRandomInt,
  generateCaptcha
}

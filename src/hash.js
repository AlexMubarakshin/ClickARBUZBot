const crypto = require('crypto');

/**
 * Get the hash of the click
 * 
 * @param {Object} param0
 * @param {number} param0.userId - The user id
 * @param {number} param0.lastClickSeconds - The last click seconds
 * @param {string} param0.secretKey - The secret key
 * @returns {string}
 */
function getClickHash({ userId, lastClickSeconds, secretKey }) {
  const dataCheckString = `${userId}:${lastClickSeconds}`;

  const hmac = crypto.createHmac('sha256', secretKey);
  hmac.update(dataCheckString);
  return hmac.digest('hex');
}

module.exports = getClickHash;
/**
 * @typedef {Object} MeResponse
 * @property {number} id
 * @property {string} username
 * @property {string} fullName
 * @property {number} energy
 * @property {number} energyLimit
 * @property {number} clicks
 * @property {number} clickBoostSum
 * @property {number} energyBoostSum
 * @property {number} minerBoostSum
 * @property {Object} receipt
 * @property {number} receipt.limitSpent
 * @property {number} receipt.limit
 * @property {null} receipt.limitResetAt
 * @property {boolean} banned
 * @property {number} researchPoints
 * @property {number} lastClickSeconds
 */

/**
 * @typedef {Object} ClickResponse
 * @property {number} count
 * @property {number} currentEnergy
 * @property {number} lastClickSeconds
 */

function createApi({ baseUrl, token, userAgent, referrer }) {
  const makeRequest = async ({ path, method, body, contentType }) => {
    const url = `${baseUrl}${path}`;

    const resp = await fetch(url, {
      "body": body,
      "cache": "default",
      "credentials": "omit",
      "headers": {
        "Accept": "application/json, text/plain, */*",
        "Accept-Language": "en-GB,en;q=0.9",
        "Cache-Control": "no-cache",
        "Pragma": "no-cache",
        "User-Agent": userAgent,
        "X-Telegram-Init-Data": token,
        "Content-Type": contentType,
      },
      "method": method,
      "mode": "cors",
      "redirect": "follow",
      "referrer": referrer,
      "referrerPolicy": "strict-origin-when-cross-origin"
    });
    return resp.json();
  };

  /**
   * Get the user information
   * 
   * @returns {Promise<MeResponse>}
   */
  const me = () => makeRequest({ path: "/api/users/me", method: "GET" });

  /**
   * Apply arbuz click
   * 
   * @returns {Promise<ClickResponse>}
   */
  const click = ({ count, hash }) => makeRequest({
    path: "/api/click/apply",
    method: "POST",
    contentType: 'application/json',
    body: JSON.stringify({ count, hash })
  });

  return {
    me,
    click,
  };
}

module.exports = createApi;

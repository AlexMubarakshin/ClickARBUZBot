/**
 * Parse the environment variables to get the accounts (useragents and raw data)
 * 
 * Example:
 * ACCOUNT_1_USER_AGENT=Mozilla/5.0 (...)
 * ACCOUNT_1_TG_RAW_DATA=query_id=1234&user=...
 * 
 * 
 * ACCOUNT_2_USER_AGENT=Mozilla/5.0 (...)
 * ACCOUNT_2_TG_RAW_DATA=query_id=2345&user=...
 * 
 * @param {*} envs = proccess.env
 * 
 * @returns {Array} - Array of accounts
 */
function parseEnvAccounts(envs) {
  const accountRegex = /^(ACCOUNT_\d)+_(\S+)/;
  const accounts = {};

  for (const key in envs) {
    if (accountRegex.test(key)) {
      const [_, account, type] = key.match(accountRegex);
      const value = envs[key];

      if (!accounts[account]) {
        accounts[account] = {};
      }

      accounts[account][type] = value;
    }
  }

  return Object.entries(accounts);
}

/**
 *  Filter the valid accounts with useragent and raw data
 * 
 * @param {Array} accounts - Array of accounts
 * 
 * @returns {Array} - Array of valid accounts
 */
function filterValidAccounts(accounts) {
  return accounts.reduce((acc, [NAME, { USER_AGENT, TG_RAW_DATA,  }]) => {
    if (NAME && USER_AGENT && TG_RAW_DATA) {
      return [...acc, { NAME, USER_AGENT, TG_RAW_DATA }];
    }

    return acc;
  }, []);
}


function getEnvironments() {
  const accounts = parseEnvAccounts(process.env);

  return {
    accounts: filterValidAccounts(accounts),
  };
}

module.exports = getEnvironments;
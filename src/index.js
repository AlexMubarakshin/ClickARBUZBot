const createApi = require("./api");
const constants = require('./constants');
const getEnvironments = require("./environments");
const getClickHash = require("./hash");
const createLogger = require("./logger");
const process = require("process");
const { randomBetween, wait, unixToDate, prettifyNumber } = require("./utils");

const envnvironments = getEnvironments();

const logger = createLogger(envnvironments.palette);

async function processAccount({ api, account, profile }) {
  const hash = getClickHash({
    userId: profile.id,
    lastClickSeconds: profile.lastClickSeconds,
    secretKey: constants.ARBUZ_SECRET,
  });

  const count = profile.energy > constants.MAX_ENERGY_TO_CLICK ?
    randomBetween(constants.MIN_ENERGY_TO_CLICK, constants.MAX_ENERGY_TO_CLICK)
    : Math.round(profile.energy * 0.8);

  const accountLogInfoPrefix = `[${account.NAME}] (${profile.username}) -`;

  const clickResponse = await api.click({
    count,
    hash,
  });

  if (!('currentEnergy' in clickResponse) || !('lastClickSeconds' in clickResponse)) {
    const error = new Error(`Invalid response from the server: ${JSON.stringify(clickResponse)}`);
    error.resposne = clickResponse;
    error.account = account;
    error.profile = profile;

    throw error;
  }

  logger.info(`${accountLogInfoPrefix} Clicked ${count} times. Energy: ${Math.round(clickResponse.currentEnergy)}/${profile.energyLimit}`);

  return clickResponse;
}

async function main() {
  logger.info(`Starting the ${logger.formatters.makeBold(constants.APPLICATION_NAME)} application ...`);
  logger.info(`💖 Enjoying the app? Send a thank you with a donation: ${logger.formatters.makeBold('0x75aB5a3310B7A00ac4C82AC83e0A59538CA35fEE')}`);


  if (!envnvironments.accounts.length) {
    logger.error(`No accounts found in the ${logger.formatters.makeBold(".env")} file
    Please add accounts to the ${logger.formatters.makeBold(".env")} file
    
    Example:
      ${logger.formatters.makeBold("ACCOUNT_1_TG_RAW_DATA")}="123456789:ABCDEFGH"
      ${logger.formatters.makeBold("ACCOUNT_1_USER_AGENT")}="Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/58.0.3029.110 Safari/537.3"

      `);

    process.exit(1);
  }

  const acoountsInformationsPromises = envnvironments.accounts.map(async (account) => {
    const api = createApi({
      baseUrl: "https://arbuz.betty.games",
      token: account.TG_RAW_DATA,
      referrer: "https://arbuzapp.betty.games/",
      userAgent: account.USER_AGENT,
    });

    const me = await api.me();

    if (me.banned) {
      logger.error(`Account ${account.NAME} (${me.username}) has been banned:`);
      throw new Error(`Account ${account.NAME} (${me.username}) has been banned:`);
    }

    return {
      account,
      api,
      profile: me,
    };
  });

  const results = await Promise.allSettled(acoountsInformationsPromises);
  const getMeErrors = results.filter((result) => result.status === 'rejected');
  if (getMeErrors.length) {
    logger.error('Errors getting the accounts information:');
  }
  getMeErrors.forEach((error) => {
    logger.error(error.reason);
  });

  const accounts = results.filter((result) => result.status === 'fulfilled').map((result) => result.value);
  if (!accounts.length) {
    logger.error('No accounts available');
    process.exit(1);
  }

  logger.info(`Accounts available: ${accounts.length}`);
  accounts.forEach(({
    account,
    profile,
  }) => {
    logger.info(`
    Stats for account ${account.NAME} (${profile.username})):

      ⚡️ Energy: ${logger.formatters.makeBold(Math.round(profile.energy) + '/' + profile.energyLimit)}
      🔋 Enery per minute: ${logger.formatters.makeBold(Math.round(profile.energyBoostSum * 60))}
      👆 Clicks: ${logger.formatters.makeBold(prettifyNumber(profile.clicks))}
      🔬 Research Points: ${logger.formatters.makeBold(profile.researchPoints)}
      🕒 Last click: ${logger.formatters.makeBold(unixToDate(profile.lastClickSeconds).toLocaleString())}
  `);
  });


  while (true) {
    const process = async (account) => {
      const result = await processAccount(account);

      account.profile.energy = result.currentEnergy;
      account.profile.lastClickSeconds = result.lastClickSeconds;
    };

    const processingResults = await Promise.allSettled(accounts.map(process));

    processingResults.forEach((result) => {

      if (result.status === 'rejected') {
        const error = result.reason;
        if (error.account) {
          logger.error(`Error processing account ${error.account.NAME} (${error.profile.username}): ${error.message}`);
          return;
        }

        logger.error(`Error processing account: ${error.message}`);
      }
    });

    const delay = randomBetween(envnvironments.stepsDelays[0], envnvironments.stepsDelays[1]);

    logger.info(`Waiting ${delay} seconds before the next click...`);

    await wait(delay);

    for (const account of accounts) {
      const profile = account.profile;
      const approximatedEneryAfterDelay = Math.round(profile.energy + (delay * profile.energyBoostSum));

      logger.info(`[${account.account.NAME}] (${profile.username}) - Approximated energy after delay: ${approximatedEneryAfterDelay}`);
      account.profile.energy = approximatedEneryAfterDelay;
    }
  }
}

main();
const RATES_API_URL = "https://open.er-api.com/v6/latest/USD"; // Exchange rates
const NAMES_API_URL = "https://openexchangerates.org/api/currencies.json"; // Currency names API

window.addEventListener("load", async () => {
  await loadLanguageConfig();
  checkOnlineStatus();
  await ensureRatesAreUpdated();
  populateCurrencySelectors();
  loadSavedCurrencies();
});

window.addEventListener("online", () => {
  checkOnlineStatus(true);
});
window.addEventListener("offline", checkOnlineStatus);

async function loadLanguageConfig() {
  try {
    const response = await fetch("langConfig.json");
    const languages = await response.json();

    const browserLanguage = navigator.language.slice(0, 2);
    const selectedLanguage = languages[browserLanguage] || languages["en"];

    applyTranslations(selectedLanguage);
  } catch (error) {
    console.error("Error loading language configuration:", error);
  }
}

function applyTranslations(translations) {
  if (!translations) return;

  document.title = translations.title;
  document.getElementById("title").innerText = translations.title;

  document.getElementById("amount").placeholder =
    translations.amountPlaceholder;
  document.getElementById("convertButton").innerText =
    translations.convertButton;
  document.getElementById("swapButton").innerText = translations.swapButton;

  window.translations = translations;
}

async function fetchRates() {
  try {
    const ratesResponse = await fetch(RATES_API_URL);
    if (!ratesResponse.ok) throw new Error("Failed to fetch exchange rates");
    const ratesData = await ratesResponse.json();

    const namesResponse = await fetch(NAMES_API_URL);
    if (!namesResponse.ok) throw new Error("Failed to fetch currency names");
    const currencyNames = await namesResponse.json();

    const lastUpdatedDate = new Date(ratesData.time_last_update_utc);

    const enrichedData = {
      rates: ratesData.rates,
      names: currencyNames,
      lastUpdated: lastUpdatedDate.toISOString(),
    };

    localStorage.setItem("exchangeRates", JSON.stringify(enrichedData));
    localStorage.setItem("ratesTimestamp", Date.now());

    displayError("hide");
  } catch (error) {
    console.error("Failed to fetch rates:", error);

    if (!navigator.onLine) {
      displayError("offline");
    }
  }
}

function checkOnlineStatus(backOnline = false) {
  const statusMessage = document.getElementById("status-message");
  if (navigator.onLine) {
    if (backOnline) {
      statusMessage.innerText = window.translations.status.online;
      statusMessage.classList.remove("offline");
      setTimeout(() => {
        statusMessage.innerText = "";
      }, 3000);
    } else {
      statusMessage.innerText = "";
    }
  } else {
    statusMessage.innerText = window.translations.status.offline;
    statusMessage.classList.add("offline");
  }
}

function hideOnlineMessage() {
  const statusMessage = document.getElementById("status-message");
  if (statusMessage.innerText === "You are online") {
    statusMessage.innerText = "";
  }
}

function populateCurrencySelectors() {
  const data = getRatesData();
  if (!data || !data.rates || !data.names) return;

  const currencyKeys = Object.keys(data.rates);

  const fromCurrency = document.getElementById("fromCurrency");
  const toCurrency = document.getElementById("toCurrency");

  fromCurrency.innerHTML = "";
  toCurrency.innerHTML = "";

  currencyKeys.forEach((currency) => {
    const currencyName = data.names[currency] || currency;

    const optionFrom = document.createElement("option");
    optionFrom.value = currency;
    optionFrom.text = `${currency} - ${currencyName}`;
    fromCurrency.appendChild(optionFrom);

    const optionTo = document.createElement("option");
    optionTo.value = currency;
    optionTo.text = `${currency} - ${currencyName}`;
    toCurrency.appendChild(optionTo);
  });

  fromCurrency.value = "USD";
  toCurrency.value = "EUR";

  fromCurrency.addEventListener("change", saveSelectedCurrencies);
  toCurrency.addEventListener("change", saveSelectedCurrencies);
}

function saveSelectedCurrencies() {
  const fromCurrency = document.getElementById("fromCurrency").value;
  const toCurrency = document.getElementById("toCurrency").value;
  localStorage.setItem("fromCurrency", fromCurrency);
  localStorage.setItem("toCurrency", toCurrency);
}

function loadSavedCurrencies() {
  const savedFromCurrency = localStorage.getItem("fromCurrency");
  const savedToCurrency = localStorage.getItem("toCurrency");
  if (savedFromCurrency) {
    document.getElementById("fromCurrency").value = savedFromCurrency;
  }
  if (savedToCurrency) {
    document.getElementById("toCurrency").value = savedToCurrency;
  }
}

function swapCurrencies() {
  const fromCurrency = document.getElementById("fromCurrency");
  const toCurrency = document.getElementById("toCurrency");

  const tempValue = fromCurrency.value;
  fromCurrency.value = toCurrency.value;
  toCurrency.value = tempValue;

  saveSelectedCurrencies();
}

function getRatesData() {
  const cachedRates = localStorage.getItem("exchangeRates");
  if (cachedRates) {
    displayError("hide");
    return JSON.parse(cachedRates);
  } else {
    displayError("noData");
    return { rates: {}, names: {}, lastUpdated: null };
  }
}

async function ensureRatesAreUpdated() {
  const data = getRatesData();
  if (data.lastUpdated) {
    const lastUpdatedDate = new Date(data.lastUpdated);
    console.log(lastUpdatedDate);

    const now = new Date();
    const timeDifference = now - lastUpdatedDate;
    const oneDay = 24 * 60 * 60 * 1000;

    if (timeDifference < oneDay) {
      console.log("Using cached rates");
      return;
    }
  }

  await fetchRates();
}

function convertCurrency() {
  hideOnlineMessage();

  const amount = document.getElementById("amount").value;
  const fromCurrency = document.getElementById("fromCurrency").value;
  const toCurrency = document.getElementById("toCurrency").value;

  if (!amount || amount <= 0) {
    displayError("invalidAmount");
    return;
  }

  const ratesData = getRatesData();
  const fromRate = ratesData.rates[fromCurrency];
  const toRate = ratesData.rates[toCurrency];
  const convertedAmount = (amount / fromRate) * toRate;

  document.getElementById(
    "result"
  ).innerText = `${amount} ${fromCurrency} = ${convertedAmount.toFixed(
    2
  )} ${toCurrency}`;

  const lastUpdatedDate = new Date(ratesData.lastUpdated);
  const lastUpdatedLabel = window.translations?.lastUpdated || "Last updated";
  document.getElementById(
    "last-updated"
  ).innerText = `${lastUpdatedLabel}: ${lastUpdatedDate.toLocaleDateString()}`;

  displayError("hide");
}

function displayError(type) {
  const errorMessage = window.translations?.errorMessages?.[type];
  document.getElementById("error-message").innerText = errorMessage;
}

function validateAmountInput(input) {
  const validPattern = /^(0|[1-9]\d*)(\.\d{1,2})?$/;

  if (!validPattern.test(input.value)) {
    input.value = input.value.slice(0, -1);
  }

  if (input.value < 0) {
    input.value = "";
  }
}

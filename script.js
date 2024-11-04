const API_URL = 'https://api.exchangerate-api.com/v4/latest/USD';

// Load initial data
window.addEventListener('load', async () => {
    await fetchRates();
    populateCurrencySelectors();
});

// Fetch rates from API and store in localStorage
async function fetchRates() {
    try {
        const response = await fetch(API_URL);
        const data = await response.json();
        localStorage.setItem('exchangeRates', JSON.stringify(data));
        localStorage.setItem('ratesTimestamp', Date.now());
    } catch (error) {
        console.error('Failed to fetch rates:', error);
        alert('Using offline rates due to connection issue');
    }
}

// Populate dropdowns with currency options
function populateCurrencySelectors() {
    const data = getRatesData();
    const currencyKeys = Object.keys(data.rates);

    const fromCurrency = document.getElementById('fromCurrency');
    const toCurrency = document.getElementById('toCurrency');

    currencyKeys.forEach(currency => {
        const optionFrom = document.createElement('option');
        optionFrom.value = currency;
        optionFrom.text = currency;
        fromCurrency.appendChild(optionFrom);

        const optionTo = document.createElement('option');
        optionTo.value = currency;
        optionTo.text = currency;
        toCurrency.appendChild(optionTo);
    });

    // Set default currencies
    fromCurrency.value = 'USD';
    toCurrency.value = 'EUR';
}

// Swap the values of the two currency selectors
function swapCurrencies() {
    const fromCurrency = document.getElementById('fromCurrency');
    const toCurrency = document.getElementById('toCurrency');
    const tempValue = fromCurrency.value;
    fromCurrency.value = toCurrency.value;
    toCurrency.value = tempValue;
}

// Get rates from localStorage, falling back to offline data if available
function getRatesData() {
    const cachedRates = localStorage.getItem('exchangeRates');
    if (cachedRates) {
        return JSON.parse(cachedRates);
    } else {
        alert('No exchange rates data available. Please connect to the internet.');
        return { rates: { USD: 1 } }; // Default to USD if no data available
    }
}

// Perform the conversion
function convertCurrency() {
    const amount = document.getElementById('amount').value;
    const fromCurrency = document.getElementById('fromCurrency').value;
    const toCurrency = document.getElementById('toCurrency').value;

    if (!amount || amount <= 0) {
        alert('Please enter a valid amount');
        return;
    }

    const ratesData = getRatesData();
    const fromRate = ratesData.rates[fromCurrency];
    const toRate = ratesData.rates[toCurrency];
    const convertedAmount = (amount / fromRate) * toRate;

    document.getElementById('result').innerText = `${amount} ${fromCurrency} = ${convertedAmount.toFixed(2)} ${toCurrency}`;
}

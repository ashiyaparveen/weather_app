
// Selectors for weather details
let degree = document.querySelector(".degree");
let district = document.querySelector(".district");
let mintemp = document.querySelector(".mintemp");
let maxtemp = document.querySelector(".maxtemp");
let inputuser = document.querySelector("#cityInput");
let wind = document.querySelector(".wind");
let humidity = document.querySelector(".humidity");
let cloudy = document.querySelector(".cloudy");
let mainCondition = document.querySelector(".dominant-condition");
let updateTime = document.querySelector(".datetime");
let updateDate = document.querySelector(".time");

// Temperature unit selector
let tempUnitSelector = document.querySelector("#tempUnit");
let tempUnit = "Celsius"; // Default temperature unit

// Threshold tracking variables
let tempThreshold = 35; // Default temperature threshold
let windThreshold = 20; // Default wind speed threshold
let humidityThreshold = 80; // Default humidity threshold
let tempBreachCount = 0; // Count of consecutive temperature breaches

// Conversion utility functions
const convertKelvinToCelsius = (kelvin) => (kelvin - 273.15).toFixed(1);
const convertKelvinToFahrenheit = (kelvin) => ((kelvin - 273.15) * 9/5 + 32).toFixed(1);
const convertCelsiusToFahrenheit = (celsius) => (celsius * 9/5 + 32).toFixed(1);
const convertCelsiusToKelvin = (celsius) => (parseFloat(celsius) + 273.15).toFixed(1);

// Function to update weather information on UI
const datainformationcollector = (jsonData) => {
    let temp = jsonData.main.temp;
    let tempMin = jsonData.main.temp_min;
    let tempMax = jsonData.main.temp_max;
    let feelsLike = jsonData.main.feels_like;

    // Convert temperatures based on user preference
    if (tempUnit === "Celsius") {
        temp = temp.toFixed(1) + "°C";
        tempMin = tempMin.toFixed(1) + "°C";
        tempMax = tempMax.toFixed(1) + "°C";
        feelsLike = feelsLike.toFixed(1) + "°C";
    } else if (tempUnit === "Fahrenheit") {
        temp = convertCelsiusToFahrenheit(temp) + "°F";
        tempMin = convertCelsiusToFahrenheit(tempMin) + "°F";
        tempMax = convertCelsiusToFahrenheit(tempMax) + "°F";
        feelsLike = convertCelsiusToFahrenheit(feelsLike) + "°F";
    }

    // Update UI elements
    district.textContent = jsonData.name;
    degree.textContent = temp; // Display converted temperature
    mintemp.textContent = tempMin;
    maxtemp.textContent = tempMax;
    humidity.textContent = jsonData.main.humidity + "%";
    wind.textContent = jsonData.wind.speed + " km/h";
    cloudy.textContent = jsonData.weather[0].description;
    mainCondition.textContent = jsonData.weather[0].main;

    let date = new Date(jsonData.dt * 1000);
    const daysOfWeek = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
    let dayName = daysOfWeek[date.getDay()];
    const dateNum = date.getDate();
    let months = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
    let monthName = months[date.getMonth()];
    const timeHour = date.getHours();
    const timeMinutes = date.getMinutes().toString().padStart(2, '0');
    const timeSeconds = date.getSeconds().toString().padStart(2, '0');
    updateTime.innerHTML = `Last Updated: ${dayName} ${monthName} ${timeHour}:${timeMinutes}:${timeSeconds}`;

    // Check threshold alerts
    checkThresholds(jsonData);
};

// Function to check thresholds and send notifications
const checkThresholds = (weatherData) => {
    // Update thresholds from user input
    tempThreshold = parseFloat(document.querySelector("#tempThreshold").value) || 35;
    windThreshold = parseFloat(document.querySelector("#windThreshold").value) || 20;
    humidityThreshold = parseFloat(document.querySelector("#humidityThreshold").value) || 80;

    const currentTemp = parseFloat(weatherData.main.temp);
    const currentWind = parseFloat(weatherData.wind.speed);
    const currentHumidity = parseFloat(weatherData.main.humidity);

    // Check temperature threshold
    if (currentTemp > tempThreshold) {
        tempBreachCount++;
        if (tempBreachCount === 1) { // Trigger alert if breached for two consecutive updates
            alert(`Temperature Alert: The temperature is above the threshold: ${currentTemp}°C`);
            console.log(`Temperature Alert: The temperature is above the threshold: ${currentTemp}°C`);

            // sendEmailNotification("Temperature Alert", `The temperature is above the threshold: ${currentTemp}°C`);
        }
    } else {
        // Reset breach count if below threshold
        tempBreachCount = 0;
    }

    // Check wind speed threshold
    if (currentWind > windThreshold) {
        alert(`Wind Speed Alert: The wind speed is above the threshold: ${currentWind} km/h`);
        console.log(`Wind Speed Alert: The wind speed is above the threshold: ${currentWind} km/h`);

        // sendEmailNotification("Wind Speed Alert", `The wind speed is above the threshold: ${currentWind} km/h`);
    }

    // Check humidity threshold
    if (currentHumidity > humidityThreshold) {
        alert(`Humidity Alert: The humidity level is above the threshold: ${currentHumidity}%`);
        console.log(`Humidity Alert: The humidity level is above the threshold: ${currentHumidity}%`);

        // sendEmailNotification("Humidity Alert", `The humidity level is above the threshold: ${currentHumidity}%`);
    }
};

// Function to send email notification
const sendEmailNotification = (subject, message) => {
    // Use EmailJS to send an email
    emailjs.send("YOUR_SERVICE_ID", "YOUR_TEMPLATE_ID", { subject, message })
        .then(response => {
            console.log("Email sent successfully!", response.status, response.text);
        })
        .catch(error => {
            console.error("Failed to send email", error);
        });
};

// Function to fetch weather data from OpenWeather API
const fetchWeatherData = async (city) => {
    try {
        const apiKey = '4b9b8688eca407ea3546cf525c8f03cb'; // Replace with your actual API key
        let response = await fetch(`https://api.openweathermap.org/data/2.5/weather?q=${city}&appid=${apiKey}&units=metric`);
        let data = await response.json();
        //storing data in db
        const weatherData = await fetch("http://localhost:8084/add", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                city: data.name,
                temperature: data.main.temp,
                tempMax: data.main.temp_max,
                tempMin: data.main.temp_min,
                description: data.weather[0].description,
            }),
        })
        .then(response => response.json())
        .catch(error => console.error("Error:", error));
        console.log('db',weatherData);
        await updateSummary(city);
        //third party api data
        console.log(data);
        if (data) {
            datainformationcollector(data); // Process and display data
            updateDate.innerHTML = new Date(data.dt * 1000).toLocaleDateString();
        }
    } catch (error) {
        console.error("Error fetching weather data:", error);
    }
};

const updateSummary = async (city) => {
    let weatherData;

    await fetch(`http://localhost:8084/${city}`, {
        method: "GET",
        headers: {
            "Content-Type": "application/json",
        },
    })
        .then(response => {
            if (!response.ok) {
                throw new Error(`HTTP error! Status: ${response.status}`);
            }
            return response.json();
        })
        .then(data => {
            weatherData = data; // Store the fetched data in the variable
            console.log("Weather Data:", weatherData); // Log the weather data
        })
        .catch(error => console.error("Error:", error));
    console.log('response', weatherData);
    document.querySelector('.avg-temp').innerHTML=`Average Temperature: ${weatherData.avgTemperature}`;
    document.querySelector('.max-temp').innerHTML=`Maximum Temperature: ${weatherData.avgTempMax}`;
    document.querySelector('.min-temp').innerHTML=`Minimum Temperature: ${weatherData.avgTempMin}`;

}

// Initial fetch for a default city
fetchWeatherData("Salem");

// Event listener for threshold form submission
document.querySelector("#thresholdForm").addEventListener("submit", (event) => {
    event.preventDefault(); // Prevent page reload
    let city = inputuser.value || "Salem"; // Default to a city if input is empty
    fetchWeatherData(city);
});

// Listen for temperature unit changes
tempUnitSelector.addEventListener("change", () => {
    tempUnit = tempUnitSelector.value; // Update the unit preference
    let city = inputuser.value || "Salem"; // Default to a city if input is empty
    fetchWeatherData(city); // Fetch data again with the new unit
});

// Fetch weather data by city name on Enter key
inputuser.addEventListener("keydown", (event) => {
    if (event.key === "Enter") {
        event.preventDefault();
        let city = inputuser.value;
        fetchWeatherData(city); // Fetch weather data for the specified city
    }
});


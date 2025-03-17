const socket = io('https://dronelandingservice-d0c7gxfwdkbjb7ar.italynorth-01.azurewebsites.net/drone-landing', { path: '/ws' });

const deliveryForm = document.getElementById('deliveryForm');
const landAirIdInput = document.getElementById('landAirId');
const deliveryNameInput = document.getElementById('deliveryName');
const deviceAddressInput = document.getElementById('deviceAddress');
const errorMessage = document.getElementById('errorMessage');
const statusContainer = document.getElementById('statusContainer');
const statusMessage = document.getElementById('statusMessage');
const deviceAddressStatus = document.getElementById('deviceAddressStatus');
const successButton = document.getElementById('successButton');
const failButton = document.getElementById('failButton');


function initAutocomplete() {
    const input = document.getElementById('deviceAddress');
    const autocomplete = new google.maps.places.Autocomplete(input);

    autocomplete.addListener('place_changed', async () => {
        const place = autocomplete.getPlace();
        if (!place.geometry || !place.formatted_address) {
            console.error("No valid address found.");
            return;
        }

        const lat = place.geometry.location.lat();
        const lng = place.geometry.location.lng();
        const locationString = `${lat}, ${lng}`; // יצירת מחרוזת "lat, lng"

        console.log(`Selected location: ${locationString}`);

        // קבלת ה-Land Air ID להזנת ה-API
        const landAirId = document.getElementById('landAirId').value.trim();
        if (!landAirId) {
            console.error("Land Air ID is required for updating location.");
            return;
        }

        // שליחת עדכון ל-DB
        await updateDeviceLocation(landAirId, locationString);
    });
}

// שליחת בקשת PUT לעדכון מיקום
async function updateDeviceLocation(landAirId, locationString) {
    const url = `https://api-service-hab9fmgne7dxa5ad.italynorth-01.azurewebsites.net/api/device/${landAirId}`;

    const data = {
        location: locationString // שליחה כמחרוזת
    };

    try {
        const response = await fetch(url, {
            method: "PUT",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify(data)
        });

        if (!response.ok) {
            throw new Error(`Failed to update location: ${response.statusText}`);
        }

        console.log("Device location updated successfully.");
    } catch (error) {
        console.error("Error updating device location:", error);
    }
}

// הפעלת ה-Autocomplete כאשר הדף נטען
window.onload = initAutocomplete;



// בדיקה אם המכשיר פעיל
async function isDeviceActive(landAirId) {
    try {
        console.log(`Checking status for device: ${landAirId}`);
        
        const response = await fetch(`https://api-service-hab9fmgne7dxa5ad.italynorth-01.azurewebsites.net/api/device/${landAirId}`);
        console.log(response, "Response object");

        if (!response.ok) {
            throw new Error(`Error fetching device status: ${response.statusText}`);
        }

        const device = await response.json();
        console.log('Device data:', device);

        return device.status === 'Active';
    } catch (error) {
        console.error('Error checking device status:', error);
        return false;
    }
}

// שליחת בקשה ליצירת משלוח חדש
deliveryForm.addEventListener('submit', async (e) => {
    e.preventDefault();

    const landAirId = landAirIdInput.value.trim();
    const deliveryName = deliveryNameInput.value.trim();
    const deviceAddress = deviceAddressInput.value.trim();

    // וידוא שהכתובת הוזנה
    if (!deviceAddress) {
        errorMessage.textContent = 'Please enter a device address.';
        return;
    }

    // בדיקת סטטוס המכשיר
    const isActive = await isDeviceActive(landAirId);

    if (!isActive) {
        errorMessage.textContent = `Device ${landAirId} is not active. Please check the status.`;
        return;
    }

    // בדיקה אם החיבור לסוקט פתוח
    if (socket.connected) {
        // שליחת הכתובת יחד עם נתוני המשלוח
        socket.emit('NEW_DELIVERY', { landAirId, deliveryName, deviceAddress });
    } else {
        errorMessage.textContent = 'Socket connection is not open.';
    }
});

// האזנה להודעות מהשרת
socket.on('deliveryStarted', (data) => {
    if (data.status === 201) {
        errorMessage.textContent = '';
        deliveryForm.style.display = 'none';
        statusContainer.style.display = 'block';
        statusMessage.textContent = data.value;
        
        // הצגת הכתובת בחלק הסטטוס
        deviceAddressStatus.value = deviceAddressInput.value;
    } else {
        errorMessage.textContent = data.value;
    }
});

// האזנה להודעות שגיאה
socket.on('errorMessage', (data) => {
    errorMessage.textContent = data.value;
    setTimeout(() => {
        errorMessage.textContent = '';
    }, 5000); // הסתר את ההודעה לאחר 5 שניות
});

// טיפול באירוע הצלחה
successButton.addEventListener('click', () => {
    if (socket.connected) {
        socket.emit('FINISH_DELIVERY', { success: true });
    }
    alert("Delivery successful!");
    statusContainer.style.display = 'none';
    deliveryForm.style.display = 'block';
    deviceAddressInput.value = ''; // ניקוי שדה הכתובת
});

// טיפול באירוע כישלון
failButton.addEventListener('click', () => {
    if (socket.connected) {
        socket.emit('FINISH_DELIVERY', { success: false });
    }
    alert("Delivery failed!");
    statusContainer.style.display = 'none';
    deliveryForm.style.display = 'block';
    deviceAddressInput.value = ''; // ניקוי שדה הכתובת
});
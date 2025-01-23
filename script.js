const socket = io('https://dronelandingservice-d0c7gxfwdkbjb7ar.italynorth-01.azurewebsites.net/drone-landing', { path: '/ws' });

const deliveryForm = document.getElementById('deliveryForm');
const landAirIdInput = document.getElementById('landAirId');
const deliveryNameInput = document.getElementById('deliveryName');
const errorMessage = document.getElementById('errorMessage');
const statusContainer = document.getElementById('statusContainer');
const statusMessage = document.getElementById('statusMessage');
const successButton = document.getElementById('successButton');
const failButton = document.getElementById('failButton');

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

    // בדיקת סטטוס המכשיר
    const isActive = await isDeviceActive(landAirId);

    if (!isActive) {
        errorMessage.textContent = `Device ${landAirId} is not active. Please check the status.`;
        return;
    }

    // בדיקה אם החיבור לסוקט פתוח
    if (socket.connected) {
        socket.emit('NEW_DELIVERY', { landAirId, deliveryName });
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
});

// טיפול באירוע כישלון
failButton.addEventListener('click', () => {
    if (socket.connected) {
        socket.emit('FINISH_DELIVERY', { success: false });
    }
    alert("Delivery failed!");
    statusContainer.style.display = 'none';
    deliveryForm.style.display = 'block';
});

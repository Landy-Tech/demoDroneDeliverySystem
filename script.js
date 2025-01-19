const socket = io('dronelandingservice-d0c7gxfwdkbjb7ar.italynorth-01.azurewebsites.net/drone-landing', { path: '/ws' });

const deliveryForm = document.getElementById('deliveryForm');
const landAirIdInput = document.getElementById('landAirId');
const deliveryNameInput = document.getElementById('deliveryName');
const errorMessage = document.getElementById('errorMessage');
const statusContainer = document.getElementById('statusContainer');
const statusMessage = document.getElementById('statusMessage');
const successButton = document.getElementById('successButton');
const failButton = document.getElementById('failButton');

// Submit a request to create a new delivery
deliveryForm.addEventListener('submit', (e) => {
    e.preventDefault();

    const landAirId = landAirIdInput.value.trim();
    const deliveryName = deliveryNameInput.value.trim();

    if (socket.connected) {
        socket.emit('NEW_DELIVERY', { landAirId, deliveryName });
    } else {
        errorMessage.textContent = 'Socket connection is not open.';
    }
});

// Listen for server messages
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

// Handle success
successButton.addEventListener('click', () => {
    if (socket.connected) {
        const finishTime = new Date().toISOString(); // Get the current time
        socket.emit('FINISH_DELIVERY', { success: true, finishTime });
    }
    alert("Delivery successful!");
    statusContainer.style.display = 'none';
    deliveryForm.style.display = 'block';
});

// Handle failure
failButton.addEventListener('click', () => {
    if (socket.connected) {
        const finishTime = new Date().toISOString(); // Get the current time
        socket.emit('FINISH_DELIVERY', { success: false, finishTime });
    }
    alert("Delivery failed!");
    statusContainer.style.display = 'none';
    deliveryForm.style.display = 'block';
});

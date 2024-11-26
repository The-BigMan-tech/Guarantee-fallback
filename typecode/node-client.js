const data = document.getElementById('fetched');

fetch('http://localhost:4000/',{method:'GET'})
    .then(response => {
        return (response.ok)?response.text():'Could not connect to server'; // Return the text response for the next then
    })
    .then(text => {
        data.textContent = text; // Set the text content
    })
    .catch(error => {
        console.error('Fetch error:', error);
    });


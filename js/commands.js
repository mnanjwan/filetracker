document.addEventListener('DOMContentLoaded', () => {
    const userData = JSON.parse(localStorage.getItem('userData'));
    const token = userData ? userData.token : null;
    
    const headers = {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
    };

    const selectCommand = document.getElementById('users-command');
    const createNewCommandInput = document.getElementById('create-new-command');

    // Fetch the list of commands and populate the dropdown
    fetch('/get-all-commands', {
        method: 'GET',
        headers: headers
    })
    .then(response => response.json())
    .then(commands => {
        commands.forEach(command => {
            const option = document.createElement('option');
            option.value = command.id;
            option.textContent = command.name;
            selectCommand.appendChild(option);
        });
    })
    .catch(error => console.error('Error fetching commands:', error));

    // Handle the 'Create New Command' selection
    selectCommand.addEventListener('change', (event) => {
        if (event.target.value === 'create-new') {
            createNewCommandInput.style.display = 'block';
        } else {
            createNewCommandInput.style.display = 'none';
        }
    });

    const departmentSelect = document.getElementById('sending-to');

    // When a command is selected, fetch corresponding units
    selectCommand.addEventListener('change', function () {
        const commandId = this.value;

        if (commandId) {
            // Fetch units from the server based on the commandId
            fetch(`/units/by-command/${commandId}`)
                .then(response => response.json())
                .then(data => {
                    // Clear the current unit options
                    departmentSelect.innerHTML = '<option value="">Select Unit</option>';

                    // Add the fetched units
                    data.forEach(unit => {
                        const option = document.createElement('option');
                        option.value = unit.id;  // Set unit id as the value
                        option.text = unit.name; // Display unit name
                        departmentSelect.appendChild(option);
                    });
                })
                .catch(err => {
                    console.error('Error fetching units:', err);
                });
        } else {
            // Reset the unit dropdown if no command is selected
            departmentSelect.innerHTML = '<option value="">Select Unit</option>';
        }
    });

    // Handle form submission to create a new command 
    // document.getElementById('@@#@change-this').addEventListener('submit', (event) => {
    //     event.preventDefault();
        
    //     if (selectCommand.value === 'create-new') {
    //         const newCommandName = createNewCommandInput.value.trim();
            
    //         if (newCommandName) {
    //             // Make a request to create the new command
    //             fetch('/commands/create', {
    //                 method: 'POST',
    //                 headers: headers,
    //                 body: JSON.stringify({ name: newCommandName })
    //             })
    //             .then(response => response.json())
    //             .then(result => {
    //                 if (result.success) {
    //                     // Handle success (e.g., reload or display a success message)
    //                     alert('New command created successfully');
    //                 } else {
    //                     alert('Failed to create new command');
    //                 }
    //             })
    //             .catch(error => console.error('Error creating new command:', error));
    //         } else {
    //             alert('Please enter a new command name');
    //         }
    //     } else {
    //         // Submit the form as usual if no new command is being created
    //         event.target.submit();
    //     }
    // });
});

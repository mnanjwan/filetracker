document.addEventListener('DOMContentLoaded', () => {
    const userData = JSON.parse(localStorage.getItem('userData'));
    const token = userData ? userData.token : null;
    const command_id = userData?.command_id;
    
    let logoutTimer;

    const headers = {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    };
    
    

    function resetLogoutTimer() {
        clearTimeout(logoutTimer);
        logoutTimer = setTimeout(logoutUser, 15 * 60 * 1000); // 15 minutes
    }
    
    function logoutUser() {
      // Clear all localStorage items
        localStorage.clear();
        window.location.href = '/logout';
        alert('You have been logged out due to inactivity.');
    }
    
    // Reset the timer on any of these events
    ['click', 'mousemove', 'keypress', 'scroll', 'touchstart'].forEach(event => {
        window.addEventListener(event, resetLogoutTimer);
    });
    
    resetLogoutTimer();
    
    
    // Function to check if the department exists in the database
    async function checkDepartmentExists(departmentName) {
      try {
        const response = await fetch(`/departments/check?name=${encodeURIComponent(departmentName)}`, {
          method: 'GET',
        });
        const data = await response.json();
    
          if (response.ok) {
            // If the department exists, return its id and name
            return data.exists ? data.department : false;
          } else {
            console.error('Error checking department:', data.message);
            return false;
          }
        } catch (error) {
          console.error('Error checking department:', error);
          return false;
        }
      }

    async function handleCreateUnit(unit_name, command_id) {
      if (!unit_name || unit_name === '') return;
      try {
        const response = await fetch('/unit/create', {
          method: 'POST',
          headers,
          body: JSON.stringify({ unit_name, command_id })
        });
        const data = await response.json();
        if (response.ok) {
          // Assuming the response contains the new unit ID and command ID
          const { unitId, commandId } = data;
          console.log("data from  fetch",data, unitId,"commandId:",command_id )
    
          // Create the relationship in the command_units table
          const commandUnitResponse = await fetch('/unit/command_units', {
            method: 'POST',
            headers,
            body: JSON.stringify({ command_id, unitId })
          });
    
          if (!commandUnitResponse.ok) {
            const commandUnitErrorData = await commandUnitResponse.json();
            console.error('Error creating command unit relationship:', commandUnitErrorData.message);
            return null;
          }
    
          return 'success'; // Return the new unit ID to be used in the registration form
        } else {
          console.error('Error creating unit:', data.message, command_id, unit_name);
          return null;
        }
      } catch (error) {
        console.error('Error:', error);
        return null;
      }
    }


    // Handle login form submission
    document.getElementById('login-form')?.addEventListener('submit', async (e) => {
          e.preventDefault();
      
          const serviceNumber = document.getElementById('service-num').value.trim();
          const password = document.getElementById('password').value.trim();
          const loginErrorElement = document.getElementById('login-error'); // Normal message element
          
          // Clear previous error messages
          loginErrorElement.style.display = 'none';
          loginErrorElement.classList.remove('success', 'error');
      
          // Function to show toast
          const showToast = (title, message, isSuccess = true, duration = 5000) => {
              const toastElement = new bootstrap.Toast(document.getElementById('toastMessage'), {
                  delay: duration // Set the duration (in milliseconds)
              });
              document.getElementById('toastTitle').textContent = title;
              document.getElementById('toastBody').textContent = message;
      
              const toast = document.getElementById('toastMessage');
              if (isSuccess) {
                  toast.classList.remove('bg-danger');
                  toast.classList.add('bg-success', 'text-white');
              } else {
                  toast.classList.remove('bg-success');
                  toast.classList.add('bg-danger', 'text-white');
              }
      
              toastElement.show();
          };
      
          try {
              const response = await fetch('/auth/login', {
                  method: 'POST',
                  headers: {
                      'Content-Type': 'application/json',
                  },
                  body: JSON.stringify({ serviceNumber, password }),
              });
      
              const data = await response.json();
      
              if (response.ok) {
                  localStorage.setItem('userData', JSON.stringify(data));
      
                  // Show success toast and normal message
                  showToast('Success', 'Login successful!', true, 5000);
                  loginErrorElement.textContent = 'Login successful!';
                  loginErrorElement.classList.add('success');
                  loginErrorElement.style.display = 'block';
      
                  // Redirect based on userType after showing toast
                  const userType = data.userType;
                  await new Promise(resolve => setTimeout(resolve, 3500)); // Delay for toast duration
      
                  if (userType === 'serviceman') {
                      window.location.href = '/dashboard.html';
                  } else {
                      window.location.href = '/create_user.html';
                  }
              } else {
                  // Show error toast and normal message
                  const errorMessage = data.message || 'Login failed. Please check your credentials.';
                  showToast('Error', errorMessage, false, 3000);
                  loginErrorElement.textContent = errorMessage;
                  loginErrorElement.classList.add('error');
                  loginErrorElement.style.display = 'block';
              }
          } catch (error) {
              // Show generic error toast and normal message
              const genericErrorMessage = 'An unexpected error occurred.';
              showToast('Error', genericErrorMessage, false);
              loginErrorElement.textContent = genericErrorMessage;
              loginErrorElement.classList.add('error');
              loginErrorElement.style.display = 'block';
              console.error('Error:', error);
          }
      });  
    
    document.getElementById('reg-command')?.addEventListener('change', (e) => {
      const selectedOption = e.target.options[e.target.selectedIndex];
      const commandTextInput = document.getElementById('reg-command-text');
      commandTextInput.value = selectedOption.text;
      console.log('Selected command text:', selectedOption.text);
    });

    // Handle user registration
    document.getElementById('register-form')?.addEventListener('submit', async (e) => {
      e.preventDefault();
      
      // Disable the submit button to prevent multiple submissions
      const submitButton = document.querySelector('#register-form button[type="submit"]');
      submitButton.disabled = true;
    
      const username = document.getElementById('reg-username').value;
      const serviceNumber = document.getElementById('reg-service-number').value;
      const userType = document.getElementById('user-type').value;
      const email = document.getElementById('reg-email').value;
      let department = document.getElementById('users-unit').value;
      const command = document.getElementById('users-command').value;
      const commandText = document.getElementById('reg-command-text').value;
    
      const resultElement = document.getElementById('register-result');
      
      // Validation: Check if the service number starts with 'NCS'
      if (!serviceNumber.startsWith('NCS')) {
        resultElement.textContent = 'Error: Service number must start with "NCS".';
        resultElement.classList.remove('success');
        resultElement.classList.add('error');
        resultElement.style.display = 'block'; // Show the message
        submitButton.disabled = false;
        return; // Exit the function to prevent further execution
      }
    
      try {
        let response;
        if (department === 'create-new') {
          const createNewUnitField = document.getElementById('create-new-unit').value;
          const departmentExists = await checkDepartmentExists(createNewUnitField);
    
          if (departmentExists) {
            const { id } = departmentExists;
            const command_id = command;
            const unitId = id;
    
            const commandUnitResponse = await fetch('/unit/command_units', {
              method: 'POST',
              headers,
              body: JSON.stringify({ command_id, unitId })
            });
    
            if (commandUnitResponse.ok) {
              response = await fetch('/users/create', {
                method: 'POST',
                headers,
                body: JSON.stringify({ username, department: createNewUnitField, serviceNumber, userType, command, commandText, email })
              });
            } else {
              resultElement.textContent = 'Failed to create new unit, unit seems to already exist in the selected command.';
              resultElement.classList.remove('success');
              resultElement.classList.add('error');
              resultElement.style.display = 'block';
              submitButton.disabled = false;
              return;
            }
          } else {
            const createUnitResponse = await handleCreateUnit(createNewUnitField, command);
    
            if (createUnitResponse === 'success') {
              response = await fetch('/users/create', {
                method: 'POST',
                headers,
                body: JSON.stringify({ username, department: createNewUnitField, serviceNumber, userType, command, commandText, email })
              });
            }
          }
        } else {
          response = await fetch('/users/create', {
            method: 'POST',
            headers,
            body: JSON.stringify({ username, department, serviceNumber, userType, command, commandText, email })
          });
        }
    
        const data = await response.json();
        if (response.ok) {
          resultElement.textContent = `User created successfully, and password sent to user email.`;
          resultElement.classList.remove('error');
          resultElement.classList.add('success');
        } else {
          resultElement.textContent = data.message;
          resultElement.classList.remove('success');
          resultElement.classList.add('error');
        }
    
        resultElement.style.display = 'block'; // Show the result message
        document.getElementById('register-form').reset();
      } catch (error) {
        resultElement.textContent = 'Error: Something went wrong. Please try again.';
        resultElement.classList.remove('success');
        resultElement.classList.add('error');
        resultElement.style.display = 'block';
        console.error('Error:', error);
      } finally {
        // Re-enable the submit button
        submitButton.disabled = false;
      }
    });
    

    document.getElementById('send-otp-button')?.addEventListener('click', async () => {
        const serviceNumber = document.getElementById('service-number').value;
        const email = document.getElementById('email')?.value;
    
        const resultElement = document.getElementById('login-error');
        
        // Validation: Check if the service number starts with 'NCS'
        if (!serviceNumber.startsWith('NCS')) {
          resultElement.textContent = 'Error: Service number must start with "NCS".';
          resultElement.classList.remove('success');
          resultElement.classList.add('error');
          resultElement.style.display = 'block'; // Show the message
          return; // Exit the function to prevent further execution
        }
    
        try {
          const response = await fetch('/auth/send-otp', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({ serviceNumber, email })
          });
    
          const data = await response.json();
    
          // Check if the OTP was sent successfully
          if (response.ok) {
            resultElement.textContent = data.message;
            resultElement.classList.remove('error');
            resultElement.classList.add('success');
          } else {
            resultElement.textContent = data.message;
            resultElement.classList.remove('success');
            resultElement.classList.add('error');
          }
    
          resultElement.style.display = 'block'; // Show the result message
        } catch (error) {
          resultElement.textContent = 'Error: Failed to send OTP. Please try again later.';
          resultElement.classList.remove('success');
          resultElement.classList.add('error');
          resultElement.style.display = 'block';
          console.error('Error:', error);
        }
      });
  
  
  // Handles forgot password
  document.getElementById('forgot-password-form')?.addEventListener('submit', async (e) => {
    e.preventDefault();

    const serviceNumber = document.getElementById('service-number').value;
    const email = document.getElementById('email').value;
    const otp = document.getElementById('otp').value;
    const newPassword = document.getElementById('new-password').value;
    const resultElement = document.getElementById('new-password-result');

    // Clear previous results
    resultElement.style.display = 'none';
    resultElement.classList.remove('success', 'error');

    // Validate inputs
    if (!serviceNumber.startsWith('NCS')) {
      resultElement.textContent = 'Error: Service number must start with "NCS".';
      resultElement.classList.add('error');
      resultElement.style.display = 'block';
      return;
    }

    if (!email.includes('@')) {
      resultElement.textContent = 'Error: Invalid email address.';
      resultElement.classList.add('error');
      resultElement.style.display = 'block';
      return;
    }

    // Password validation
    const passwordPattern = /^(?=.*\d.*\d).{8,}$/;
    if (!passwordPattern.test(newPassword)) {
      resultElement.textContent = 'Error: Password must be at least 8 characters long and contain at least 2 numbers.';
      resultElement.classList.add('error');
      resultElement.style.display = 'block';
      return;
    }

    try {
      const response = await fetch('/auth/reset-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ serviceNumber, email, otp, newPassword })
      });

      const data = await response.json();

      if (response.ok) {
        resultElement.textContent = data.message;
        resultElement.classList.add('success');
      } else {
        resultElement.textContent = data.message;
        resultElement.classList.add('error');
      }

      resultElement.style.display = 'block';
    } catch (error) {
      resultElement.textContent = 'Error: Failed to reset password. Please try again later.';
      resultElement.classList.add('error');
      resultElement.style.display = 'block';
      console.error('Error:', error);
    }
  });


    // Handle file generation
    // document.getElementById('generate-file-form')?.addEventListener('submit', async (e) => {
    //         e.preventDefault();
        
    //         const form = document.getElementById('generate-file-form');
    //         const resultElement = document.getElementById('file-id-result');
        
    //         // Clear previous results
    //         resultElement.style.display = 'none';
    //         resultElement.classList.remove('success', 'error');
        
    //         // Get form values
    //         const createNewUnitField = document.getElementById('create-new-unit').value.trim();
    //         const fileData = {
    //             file_num: document.getElementById('file_num').value.trim(),
    //             location: document.getElementById('current-location').value.trim(),
    //             description: document.getElementById('description').value.trim(),
    //             sendingTo: document.getElementById('sending-to').value.trim(),
    //             status: document.getElementById('file-status').value.trim(),
    //             command_id: document.getElementById('sending-to-command').value.trim(),
    //             timestamp: new Date().toISOString().slice(0, 19).replace('T', ' '),
    //         };
    //         // view fileData content/payload
    //         // return console.log(fileData)
    //         // Validation
    //         if (!fileData.file_num) {
    //             resultElement.textContent = 'Error: File number is required.';
    //             resultElement.classList.add('error');
    //             resultElement.style.display = 'block';
    //             return;
    //         }
        
    //         // Check for invalid characters in file number
    //         const fileNumRegex = /^[\w-]+$/; // Allows letters, numbers, and hyphens only
    //         if (!fileNumRegex.test(fileData.file_num)) {
    //             resultElement.textContent = 'Error: File number can only contain letters, numbers, and hyphens (-).';
    //             resultElement.classList.add('error');
    //             resultElement.style.display = 'block';
    //             return;
    //         }
        
    //         if (!fileData.location) {
    //             resultElement.textContent = 'Error: Location is required.';
    //             resultElement.classList.add('error');
    //             resultElement.style.display = 'block';
    //             return;
    //         }
        
    //         if (!fileData.description) {
    //             resultElement.textContent = 'Error: Description is required.';
    //             resultElement.classList.add('error');
    //             resultElement.style.display = 'block';
    //             return;
    //         }
        
    //         if (fileData.sendingTo === 'create-new' && !createNewUnitField) {
    //             resultElement.textContent = 'Error: New unit name is required when creating a new unit.';
    //             resultElement.classList.add('error');
    //             resultElement.style.display = 'block';
    //             return;
    //         }
        
    //         try {
    //             let response;
    //             const headers = new Headers({
    //                 'Content-Type': 'application/json',
    //                 'Authorization': `Bearer ${token}`
    //             });
        
    //             if (fileData.sendingTo === 'create-new') {
    //                 const createUnitResponse = await handleCreateUnit(createNewUnitField, fileData.command_id);
    //                 if (createUnitResponse === 'success') {
    //                     const newFileData = {
    //                         ...fileData,
    //                         sendingTo: createNewUnitField
    //                     };
        
    //                     response = await fetch('/files/create', {
    //                         method: 'POST',
    //                         headers,
    //                         body: JSON.stringify(newFileData)
    //                     });
    //                 } else {
    //                     resultElement.textContent = 'Error: Failed to create new unit.';
    //                     resultElement.classList.add('error');
    //                     resultElement.style.display = 'block';
    //                     return;
    //                 }
    //             } else {
    //                 response = await fetch('/files/create', {
    //                     method: 'POST',
    //                     headers,
    //                     body: JSON.stringify(fileData)
    //                 });
    //             }
        
    //             if (response.ok) {
    //                 resultElement.textContent = 'File Information Logged!';
    //                 resultElement.classList.add('success');
    //             } else {
    //                 const errorData = await response.json();
    //                 resultElement.textContent = errorData.message || 'Error generating file ID.';
    //                 resultElement.classList.add('error');
    //             }
    //         } catch (error) {
    //             resultElement.textContent = 'An unexpected error occurred.';
    //             resultElement.classList.add('error');
    //             console.error('Error:', error);
    //         } finally {
    //             resultElement.style.display = 'block';
    //             form.reset();
    //         }
    //     });

     // Handle file generation
      document.getElementById('generate-file-form')?.addEventListener('submit', async (e) => {
        e.preventDefault();
    
        const form = document.getElementById('generate-file-form');
        const resultElement = document.getElementById('file-id-result');
    
        // Clear previous results
        resultElement.style.display = 'none';
        resultElement.classList.remove('success', 'error');
    
        // Get form values
        const createNewUnitField = document.getElementById('create-new-unit').value.trim();
        const fileData = {
            file_num: document.getElementById('file_num').value.trim(),
            location: document.getElementById('current-location').value.trim(),
            description: document.getElementById('description').value.trim(),
            sendingTo: document.getElementById('sending-to').value.trim(),
            status: document.getElementById('file-status').value.trim(),
            timestamp: new Date().toISOString().slice(0, 19).replace('T', ' '),
            command_id
        };
    
        // Validation
        if (!fileData.file_num) {
            resultElement.textContent = 'Error: File number is required.';
            resultElement.classList.add('error');
            resultElement.style.display = 'block';
            return;
        }
        
        // New Validation: Check if the file number is incomplete (e.g., only "NCS-")
        if (fileData.file_num === 'NCS-') {
            resultElement.textContent = 'Error: Please enter a complete file number. "NCS-" is incomplete.';
            resultElement.classList.add('error');
            resultElement.style.display = 'block';
            return;
        }
    
        // Check for invalid characters in file number
        const fileNumRegex = /^[\w-]+$/; // Allows letters, numbers, and hyphens only
        if (!fileNumRegex.test(fileData.file_num)) {
            resultElement.textContent = 'Error: File number can only contain letters, numbers, and hyphens (-).';
            resultElement.classList.add('error');
            resultElement.style.display = 'block';
            return;
        }
    
        if (!fileData.location) {
            resultElement.textContent = 'Error: Location is required.';
            resultElement.classList.add('error');
            resultElement.style.display = 'block';
            return;
        }
    
        if (!fileData.description) {
            resultElement.textContent = 'Error: Description is required.';
            resultElement.classList.add('error');
            resultElement.style.display = 'block';
            return;
        }
    
        if (fileData.sendingTo === 'create-new' && !createNewUnitField) {
            resultElement.textContent = 'Error: New unit name is required when creating a new unit.';
            resultElement.classList.add('error');
            resultElement.style.display = 'block';
            return;
        }
    
        try {
            let response;
            const headers = new Headers({
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            });
    
            if (fileData.sendingTo === 'create-new') {
                const createUnitResponse = await handleCreateUnit(createNewUnitField, fileData.command_id);
                if (createUnitResponse === 'success') {
                    const newFileData = {
                        ...fileData,
                        sendingTo: createNewUnitField
                    };
    
                    response = await fetch('/files/create', {
                        method: 'POST',
                        headers,
                        body: JSON.stringify(newFileData)
                    });
                } else {
                    resultElement.textContent = 'Error: Failed to create new unit.';
                    resultElement.classList.add('error');
                    resultElement.style.display = 'block';
                    return;
                }
            } else {
                response = await fetch('/files/create', {
                    method: 'POST',
                    headers,
                    body: JSON.stringify(fileData)
                });
            }
    
            if (response.ok) {
                resultElement.textContent = `${fileData.file_num} File Information Logged!`;
                resultElement.classList.add('success');
            } else {
                const errorData = await response.json();
                resultElement.textContent = errorData.message || 'Error generating file ID.';
                resultElement.classList.add('error');
            }
        } catch (error) {
            resultElement.textContent = 'An unexpected error occurred.';
            resultElement.classList.add('error');
            console.error('Error:', error);
        } finally {
            resultElement.style.display = 'block';
            form.reset();
        }
    });

    

     // Handle file update
    //  document.getElementById('update-file-form')?.addEventListener('submit', async (e) => {
    //         e.preventDefault();
          
    //         // Get the input values
    //         const fileNumInput = document.getElementById('file_num').value.trim();
    //         const location = document.getElementById('current-location').value;
    //         const command_id = document.getElementById('sending-to-command').value;
    //         const sendingTo = document.getElementById('sending-to').value;
    //         const status = document.getElementById('file-status').value;
    //         const timestamp = new Date().toISOString().slice(0, 19).replace('T', ' '); // Format to 'YYYY-MM-DD HH:MM:SS'
          
    //         const resultElement = document.getElementById('update-result');
          
    //         // Clear previous results
    //         resultElement.style.display = 'none';
    //         resultElement.classList.remove('success', 'error');
          
    //         // Validate inputs
    //         if (!fileNumInput) {
    //             resultElement.textContent = 'Error: File ID is required.';
    //             resultElement.classList.add('error');
    //             resultElement.style.display = 'block';
    //             return;
    //         }
        
    //         // Check for invalid characters in file ID
    //         const fileIdRegex = /^[\w-]+$/; // Allows letters, numbers, and hyphens only
    //         if (!fileIdRegex.test(fileNumInput)) {
    //             resultElement.textContent = 'Error: File ID can only contain letters, numbers, and hyphens (-).';
    //             resultElement.classList.add('error');
    //             resultElement.style.display = 'block';
    //             return;
    //         }
          
    //         if (!location) {
    //             resultElement.textContent = 'Error: Current location is required.';
    //             resultElement.classList.add('error');
    //             resultElement.style.display = 'block';
    //             return;
    //         }
          
    //         if (!sendingTo) {
    //             resultElement.textContent = 'Error: Sending to field is required.';
    //             resultElement.classList.add('error');
    //             resultElement.style.display = 'block';
    //             return;
    //         }
          
    //         if (!status) {
    //             resultElement.textContent = 'Error: File status is required.';
    //             resultElement.classList.add('error');
    //             resultElement.style.display = 'block';
    //             return;
    //         }
          
    //         const userData = JSON.parse(localStorage.getItem('userData'));
    //         const department = userData?.department;
          
    //         try {
    //             // Prepare file update data
    //             const updateData = {
    //                 file_id: fileNumInput,
    //                 location,
    //                 sendingTo,
    //                 status,
    //                 timestamp,
    //                 command_id,
    //                 department
    //             };
          
    //             // Send update request
    //             const updateResponse = await fetch('/files/update', {
    //                 method: 'POST',
    //                 headers: {
    //                     'Content-Type': 'application/json',
    //                     'Authorization': `Bearer ${token}`
    //                 },
    //                 body: JSON.stringify(updateData)
    //             });
          
    //             if (updateResponse.ok) {
    //                 resultElement.textContent = 'File dispatched successfully!';
    //                 resultElement.classList.add('success');
    //             } else {
    //                 const errorData = await updateResponse.json();
    //                 resultElement.textContent = errorData.message || 'Error updating file.';
    //                 resultElement.classList.add('error');
    //             }
          
    //             resultElement.style.display = 'block';
    //         } catch (error) {
    //             resultElement.textContent = 'An unexpected error occurred.';
    //             resultElement.classList.add('error');
    //             console.error('Error:', error);
    //             resultElement.style.display = 'block';
    //         }
    //     });

    document.getElementById('update-file-form')?.addEventListener('submit', async (e) => {
        e.preventDefault();
      
        // Get the input values
        const fileNumInput = document.getElementById('file_num').value.trim();
        const location = document.getElementById('current-location').value;
        const sendingTo = document.getElementById('sending-to').value;
        const status = document.getElementById('file-status').value;
        const timestamp = new Date().toISOString().slice(0, 19).replace('T', ' '); // Format to 'YYYY-MM-DD HH:MM:SS'
      
        const resultElement = document.getElementById('update-result');
      
        // Clear previous results
        resultElement.style.display = 'none';
        resultElement.classList.remove('success', 'error');
      
        // Validate inputs
        if (!fileNumInput) {
            resultElement.textContent = 'Error: File ID is required.';
            resultElement.classList.add('error');
            resultElement.style.display = 'block';
            return;
        }
    
        // Check for invalid characters in file ID
        const fileIdRegex = /^[\w-]+$/; // Allows letters, numbers, and hyphens only
        if (!fileIdRegex.test(fileNumInput)) {
            resultElement.textContent = 'Error: File ID can only contain letters, numbers, and hyphens (-).';
            resultElement.classList.add('error');
            resultElement.style.display = 'block';
            return;
        }
      
        if (!location) {
            resultElement.textContent = 'Error: Current location is required.';
            resultElement.classList.add('error');
            resultElement.style.display = 'block';
            return;
        }
      
        if (!sendingTo) {
            resultElement.textContent = 'Error: Sending to field is required.';
            resultElement.classList.add('error');
            resultElement.style.display = 'block';
            return;
        }
      
        if (!status) {
            resultElement.textContent = 'Error: File status is required.';
            resultElement.classList.add('error');
            resultElement.style.display = 'block';
            return;
        }
      
        const userData = JSON.parse(localStorage.getItem('userData'));
        const command_id = userData?.command_id;
        const department = userData?.department;
      
        try {
            // Prepare file update data
            const updateData = {
                file_id: fileNumInput,
                location,
                sendingTo,
                status,
                timestamp,
                command_id,
                department
            };
      
            // Send update request
            const updateResponse = await fetch('/files/update', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(updateData)
            });
      
            if (updateResponse.ok) {
                resultElement.textContent = 'File dispatched successfully!';
                resultElement.classList.add('success');
            } else {
                const errorData = await updateResponse.json();
                resultElement.textContent = errorData.message || 'Error updating file.';
                resultElement.classList.add('error');
            }
      
            resultElement.style.display = 'block';
        } catch (error) {
            resultElement.textContent = 'An unexpected error occurred.';
            resultElement.classList.add('error');
            console.error('Error:', error);
            resultElement.style.display = 'block';
        }
    });

    
    


    document.addEventListener('DOMContentLoaded', () => {
        // Fetch file data from the server
        fetch('/admin/files')
            .then(response => response.json())
            .then(data => {
                const tableBody = document.querySelector('#files-table tbody');
                tableBody.innerHTML = ''; // Clear existing content
    
                data.forEach(file => {
                    const row = document.createElement('tr');
                    row.innerHTML = `
                        <td>${file.file_id}</td>
                        <td>${file.current_location}</td>
                        <td>${file.sending_to}</td>
                        <td>${file.status}</td>
                        <td>${file.created_by}</td>
                        <td>${file.timestamp}</td>
                    `;
                    tableBody.appendChild(row);
                });
            })
            .catch(error => {
                console.error('Error fetching files:', error);
            });
    });
    
    document.getElementById('search-type')?.addEventListener('change', function() {
      const searchType = this.value;
      const dateRangeFields = document.getElementById('date-range-fields');
      
      if (searchType === 'description') {
        dateRangeFields.style.display = 'block';
      } else {
        dateRangeFields.style.display = 'none';
      }
    });
    

    function generateDescriptionFileTableHTML(files, startDate, endDate) {
      const start = new Date(startDate);
      const end = new Date(endDate);
  
      const filteredFiles = files.filter(file => {
          const fileDate = new Date(file.timestamp);
          return (!isNaN(start.getTime()) && fileDate >= start) && (!isNaN(end.getTime()) && fileDate <= end);
      });
  
      let fileTable = `
          <h2>Search Results</h2>
          <table class="file-table">
            <thead>
              <tr>
                <th>File ID</th>
                <th>Originating Location</th>
                <th>Sent To</th>
                <th>Description</th>
                <th>Status</th>
                <th>Timestamp</th>
              </tr>
            </thead>
            <tbody>
      `;
  
      filteredFiles.forEach(file => {
          fileTable += `
            <tr>
              <td data-label="File ID">${file.file_id}</td>
              <td data-label="Originating Location">${file.current_location || 'N/A'}</td>
              <td data-label="Sent To">${file.sending_to || 'N/A'}</td>
              <td data-label="Description">${file.description || 'N/A'}</td>
              <td data-label="Status">${file.status || 'N/A'}</td>
              <td data-label="Timestamp">${new Date(file.timestamp).toLocaleString()}</td>
            </tr>
          `;
      });
  
      fileTable += `
            </tbody>
          </table>
      `;
      return fileTable;
  }
  

    
    // Handle file search
    document.getElementById('search-file-form')?.addEventListener('submit', async (e) => {
      e.preventDefault();
      const searchType = document.getElementById('search-type').value;
      const searchValue = document.getElementById('file-id').value;
      const fileInfoElement = document.getElementById('file-info');
      
      try {
        let response;
        console.log('searchType:',searchType)
    
        if (searchType === 'file_id') {
          response = await fetch(`/files/${searchValue}`, {
            headers: {
              'Authorization': `Bearer ${token}`,
            }
          });
          
          
            console.log(response)
    
          if (response.ok) {
            const data = await response.json();
            console.log(data)
            // Check if the user's command_id matches the file's command_id
            if (data.file.command_id !== command_id) {
              fileInfoElement.textContent = 'You do not have permission to view this file.';
            } else {
              fileInfoElement.innerHTML = generateTableHTML(data);
            }
          } else {
            const errorText = await response.text(); // Read response as text
            fileInfoElement.textContent = `Error: ${errorText}`;
          }
        } else if (searchType === 'description') {
          let startDate = document.getElementById('start-date').value;
          let endDate = document.getElementById('end-date').value;
        
          // Set default start date if none is provided
          if (!startDate) {
            startDate = '2024-01-01'; // Default start date
          }
        
          // Optional: Set default end date to the current date if none is provided
          if (!endDate) {
            endDate = new Date().toISOString().split('T')[0]; // Default end date is today
          }

          response = await fetch('/files/search', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ description: searchValue })
          });
    
          if (response.ok) {
            const data = await response.json();
            if (Array.isArray(data)) {
              const filteredData = data.filter(file => Number(file.command_id) === Number(command_id));
              if (filteredData.length >= 0) {
                fileInfoElement.innerHTML = generateDescriptionFileTableHTML(filteredData, startDate, endDate);
              } else {
                fileInfoElement.textContent = 'No files found or you do not have permission to view the files.';
              }
            } else {
              fileInfoElement.textContent = 'Unexpected response format.';
            }
          } else {
            const errorText = await response.text();
            fileInfoElement.textContent = `Error: ${errorText}`;
          }
        } else {
          console.log(`Search type ${searchType} not supported`);
        }
      } catch (error) {
        console.error('Error:', error);
        fileInfoElement.textContent = 'An unexpected error occurred.';
      }
    });
    
    function generateTableHTML(data) {
      // Initial HTML for file info
      let fileTable = `
        <h2>File Information</h2>
        <table class="file-table">
          <tr><th>Field</th><th>Value</th></tr>
          <tr><td>File ID</td><td>${data.file.file_id}</td></tr>
          <tr><td>Originating Location</td><td>${data.file.current_location}</td></tr>
          <tr><td>Sent To</td><td>${data.file.sending_to}</td></tr>
          <tr><td>Status</td><td>${data.file.status}</td></tr>
          <tr><td>Description</td><td>${data.file.description}</td></tr>
          <tr><td>Received</td><td>${data.file?.received ? 'Recieved Successfully' : 'Not Recieved'}</td></tr>
          <tr><td>Received By</td><td>${data.file?.received_by}</td></tr>
          <tr><td>Date Received</td><td>${data.file?.received_timestamp ? new Date(data.file.received_timestamp).toLocaleDateString() : ''}</td></tr>
          <tr><td>Timestamp</td><td>${new Date(data.file.timestamp).toLocaleString()}</td></tr>
        </table>
      `;
    
      // Add updates if available
      if (data.updates && data.updates.length > 0) {
        // Sort updates by timestamp, most recent first
        data.updates.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
    
        fileTable += `
          <h2>File Updates</h2>
          <table class="file-table">
            <tr><th>Update ID</th><th>Status</th><th>Previous Location</th><th>Sent To</th><th>Timestamp Sent</th><th>File Recieved?</th><th>Recieved By</th><th>Date Recieved</th></tr>
        `;
    
        data.updates.forEach(update => {
          fileTable += `
            <tr>
              <td>${update.id}</td>
              <td>${update.status || 'N/A'}</td>
              <td>${update.current_location || 'N/A'}</td>
              <td>${update.sending_to || 'N/A'}</td>
              <td>${new Date(update.timestamp).toLocaleString()}</td>
              <td>${update.received ?? 0 ? 'Recieved Successfully' : 'Not Recieved'}</td>
              <td>${update?.received_by || 'Null'}</td>
              <td>${update?.received_timestamp ? new Date(update.received_timestamp).toLocaleDateString() : ''}</td>
            </tr>
          `;
        });
    
        fileTable += `</table>`;
      }
    
      return fileTable;
    }              
});

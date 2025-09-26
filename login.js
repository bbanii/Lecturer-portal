document.addEventListener('DOMContentLoaded', function() {
    const loginForm = document.getElementById('login-form');
    const togglePassword = document.querySelector('.toggle-password');
    const passwordInput = document.getElementById('password');
    const loginStatus = document.getElementById('login-status');
  
    // Toggle password visibility
    togglePassword.addEventListener('click', function() {
      const type = passwordInput.getAttribute('type') === 'password' ? 'text' : 'password';
      passwordInput.setAttribute('type', type);
      this.querySelector('i').classList.toggle('fa-eye-slash');
    });
  
    // Form submission
    loginForm.addEventListener('submit', async function(e) {
      e.preventDefault();
      
      const email = document.getElementById('email').value;
      const password = passwordInput.value;
      const rememberMe = document.querySelector('input[name="remember"]').checked;
  
      // Simple validation
      if (!email || !password) {
        showLoginStatus('Please fill in all fields', 'error');
        return;
      }
  
      // Show loading state
      const submitBtn = loginForm.querySelector('button[type="submit"]');
      const originalText = submitBtn.innerHTML;
      submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Authenticating...';
      submitBtn.disabled = true;

      try {
        console.log('Attempting login with:', { email }); // Debug log
        const response = await fetch('https://department-mangement-system-97wj.onrender.com/api/auth/login', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json'
          },
          credentials: 'omit', // Changed from 'include' to 'omit'
          body: JSON.stringify({ email, password })
        });

        console.log('Response received:', response.status); // Debug log
        const data = await response.json();
        console.log('Response data:', data); // Debug log
        console.log('User role:', data.user.role); // Debug log for role

        if (!response.ok) {
          throw new Error(data.message || 'Login failed');
        }

        // Check if user is a lecturer (accepting both 'lecturer' and 'HoD' roles)
        if (data.user.role !== 'Lecturer' ) {
          throw new Error('Unauthorized access. This portal is for lecturers only.');
        }

        // Store token and user data
        localStorage.setItem('authToken', data.token);
        localStorage.setItem('userId', data.user.id);
        localStorage.setItem('departmentId', data.user.department._id);
        localStorage.setItem('departmentName', data.user.department.name);
        localStorage.setItem('departmentCode', data.user.department.code);
        
        if (rememberMe) {
          localStorage.setItem('rememberedEmail', email);
        }

        // Successful login - redirect to lecturer panel
        window.location.href = './lecturer.html';
      } catch (error) {
        showLoginStatus(error.message, 'error');
        submitBtn.innerHTML = originalText;
        submitBtn.disabled = false;
      }
    });
  
    // Show login status messages
    function showLoginStatus(message, type) {
      loginStatus.textContent = message;
      loginStatus.className = 'login-status ' + type;
      loginStatus.classList.add('show');
      
      setTimeout(() => {
        loginStatus.classList.remove('show');
      }, 5000);
    }
  
    // Check for remembered email
    const rememberedEmail = localStorage.getItem('rememberedEmail');
    if (rememberedEmail) {
      document.getElementById('email').value = rememberedEmail;
      document.querySelector('input[name="remember"]').checked = true;
    }
  });
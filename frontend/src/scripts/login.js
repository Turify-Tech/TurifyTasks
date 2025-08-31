document.addEventListener('DOMContentLoaded', function() {
	const form = document.getElementById('loginForm');
	if (!form) return;

	form.addEventListener('submit', async function(e) {
		e.preventDefault();
		
		const emailInput = document.getElementById('email');
		const passwordInput = document.getElementById('password');
		const submitBtn = document.getElementById('submitBtn');
		const buttonText = document.getElementById('buttonText');
		const loadingSpinner = document.getElementById('loadingSpinner');
		const errorMessage = document.getElementById('errorMessage');
		const successMessage = document.getElementById('successMessage');
		
		if (!emailInput || !passwordInput) return;
		
		const email = emailInput.value;
		const password = passwordInput.value;
		
		// Limpiar mensajes previos
		if (errorMessage) errorMessage.style.display = 'none';
		if (successMessage) successMessage.style.display = 'none';
		
		// Mostrar loading
		if (submitBtn) submitBtn.disabled = true;
		if (buttonText) buttonText.style.display = 'none';
		if (loadingSpinner) loadingSpinner.style.display = 'flex';
		
		try {
			const response = await fetch('http://localhost:3000/api/auth/login', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
				},
				credentials: 'include', // Importante para cookies de sesión
				body: JSON.stringify({ email, password })
			});
			
			const data = await response.json();
			
			if (response.ok) {
				// Login exitoso
				console.log('✅ Login exitoso! Datos recibidos:', data);
				
				if (successMessage) {
					successMessage.textContent = '¡Inicio de sesión exitoso! Redirigiendo...';
					successMessage.style.display = 'block';
				}
				
				// Guardar token si viene en la respuesta
				if (data.token) {
					console.log('🔑 Guardando token en localStorage...');
					localStorage.clear(); // Limpiar localStorage primero
					localStorage.setItem('authToken', data.token);
					
					// Verificar que se guardó correctamente
					const savedToken = localStorage.getItem('authToken');
					console.log('✓ Token guardado exitosamente:', savedToken ? 'SÍ' : 'NO');
					console.log('🔍 Token completo guardado:', savedToken);
				} else {
					console.warn('⚠️ No se recibió token en la respuesta');
				}
				
				// Redirigir después de 1 segundo
				setTimeout(() => {
					console.log('🔄 Redirigiendo al dashboard...');
					window.location.href = '/dashboard';
				}, 1000);
			} else {
				// Error en el login
				if (errorMessage) {
					errorMessage.textContent = data.error || 'Credenciales incorrectas. Por favor, verifica tu email y contraseña.';
					errorMessage.style.display = 'block';
				}
			}
		} catch (error) {
			console.error('Error:', error);
			if (errorMessage) {
				errorMessage.textContent = 'Error de conexión. Verifica que el servidor esté funcionando.';
				errorMessage.style.display = 'block';
			}
		} finally {
			// Restaurar botón
			if (submitBtn) submitBtn.disabled = false;
			if (buttonText) buttonText.style.display = 'inline';
			if (loadingSpinner) loadingSpinner.style.display = 'none';
		}
	});
});

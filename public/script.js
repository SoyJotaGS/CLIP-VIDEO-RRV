document.addEventListener('DOMContentLoaded', () => {
    const form = document.getElementById('form-grabar-clip');
    const placaInput = document.getElementById('placa');
    const notificacion = document.getElementById('notificacion');
    const submitButton = form.querySelector('button[type="submit"]');
    const container = document.querySelector('.container');

    // Función para mostrar notificación con animación mejorada
    function mostrarNotificacion(mensaje, tipo = 'error') {
        notificacion.textContent = mensaje;
        notificacion.className = `notificacion ${tipo}`;
        notificacion.style.display = 'block';
        
        // Trigger reflow para asegurar la animación
        notificacion.offsetHeight;
        
        // Ocultar notificación después de 8 segundos para mensajes de éxito
        if (tipo === 'success') {
            setTimeout(() => {
                notificacion.style.animation = 'slideInUp 0.3s ease reverse';
                setTimeout(() => {
                    notificacion.style.display = 'none';
                    notificacion.style.animation = '';
                }, 300);
            }, 8000);
        }
    }

    // Función para deshabilitar/habilitar el botón con spinner
    function toggleButton(disabled) {
        submitButton.disabled = disabled;
        
        if (disabled) {
            submitButton.innerHTML = '<span class="button-spinner"></span>Procesando...';
            container.classList.add('loading');
        } else {
            submitButton.innerHTML = 'Enviar';
            container.classList.remove('loading');
        }
    }

    // Función para validar formato de placa
    function validarPlaca(placa) {
        // Validación básica: al menos 3 caracteres, solo letras, números y guiones
        const regex = /^[A-Z0-9-]{3,10}$/;
        return regex.test(placa);
    }

    // Función para formatear placa automáticamente
    function formatearPlaca(input) {
        let valor = input.value.toUpperCase().replace(/[^A-Z0-9-]/g, '');
        input.value = valor;
    }

    // Verificar estado del servidor al cargar con mejor manejo de errores
    async function verificarEstadoServidor() {
        try {
            const response = await fetch('/status');
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}`);
            }
            
            const data = await response.json();
            
            if (!data.tokenAvailable) {
                mostrarNotificacion('⚠️ Advertencia: El servidor no tiene token de autenticación válido.', 'warning');
            } else {
                console.log('✅ Servidor conectado correctamente');
                // Mostrar brevemente que todo está bien
                setTimeout(() => {
                    if (notificacion.style.display === 'none') {
                        mostrarNotificacion('🟢 Sistema listo para usar', 'success');
                        setTimeout(() => {
                            notificacion.style.display = 'none';
                        }, 3000);
                    }
                }, 1000);
            }
        } catch (error) {
            console.error('Error al verificar estado del servidor:', error);
            mostrarNotificacion('⚠️ Advertencia: No se pudo conectar con el servidor. Verifique que esté ejecutándose.', 'warning');
        }
    }

    // Agregar eventos al input para formateo automático
    placaInput.addEventListener('input', (e) => {
        formatearPlaca(e.target);
        
        // Limpiar notificación cuando el usuario empiece a escribir
        if (notificacion.style.display === 'block') {
            notificacion.style.animation = 'slideInUp 0.3s ease reverse';
            setTimeout(() => {
                notificacion.style.display = 'none';
                notificacion.style.animation = '';
            }, 300);
        }
    });

    // Efecto de focus mejorado
    placaInput.addEventListener('focus', () => {
        placaInput.parentElement.style.transform = 'scale(1.02)';
    });

    placaInput.addEventListener('blur', () => {
        placaInput.parentElement.style.transform = 'scale(1)';
    });

    // Verificar estado del servidor al cargar
    verificarEstadoServidor();

    // Manejar envío del formulario
    form.addEventListener('submit', async (event) => {
        event.preventDefault();
        
        const placa = placaInput.value.trim().toUpperCase();
        
        // Validaciones
        if (!placa) {
            mostrarNotificacion('❌ Por favor ingrese una placa válida.', 'error');
            placaInput.focus();
            return;
        }

        if (!validarPlaca(placa)) {
            mostrarNotificacion('❌ Formato de placa inválido. Use solo letras, números y guiones.', 'error');
            placaInput.focus();
            return;
        }

        // Animación de envío
        container.style.transform = 'scale(0.98)';
        setTimeout(() => {
            container.style.transform = 'scale(1)';
        }, 150);

        toggleButton(true);
        notificacion.style.display = 'none';

        try {
            console.log(`📤 Enviando solicitud para placa: ${placa}`);
            
            const startTime = Date.now();
            const response = await fetch('/record', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ placa })
            });

            const endTime = Date.now();
            const duration = endTime - startTime;

            const data = await response.json();
            console.log('📥 Respuesta del servidor:', data);

            if (response.ok) {
                mostrarNotificacion(
                    `✅ ¡Clip grabado exitosamente para la placa: ${placa}! (${duration}ms)`, 
                    'success'
                );
                
                // Limpiar el formulario con animación
                placaInput.style.transform = 'scale(0.95)';
                setTimeout(() => {
                    placaInput.value = '';
                    placaInput.style.transform = 'scale(1)';
                }, 200);
                
                // Efecto de éxito en el contenedor
                container.style.boxShadow = '0 32px 64px -12px rgba(16, 185, 129, 0.25)';
                setTimeout(() => {
                    container.style.boxShadow = '';
                }, 2000);
                
            } else {
                let errorMessage = data.error || 'Error desconocido';
                
                // Personalizar mensajes de error con emojis
                if (response.status === 404) {
                    errorMessage = `🔍 No se encontró configuración para la placa: ${placa}.\nVerifique que la placa esté registrada en el sistema.`;
                } else if (response.status === 500) {
                    errorMessage = `🚨 Error del servidor: ${errorMessage}`;
                } else if (response.status === 400) {
                    errorMessage = `⚠️ Solicitud inválida: ${errorMessage}`;
                } else if (response.status === 401) {
                    errorMessage = `🔐 Error de autenticación. El token puede haber expirado.`;
                }
                
                mostrarNotificacion(errorMessage, 'error');
                
                // Efecto de error en el contenedor
                container.style.boxShadow = '0 32px 64px -12px rgba(239, 68, 68, 0.25)';
                setTimeout(() => {
                    container.style.boxShadow = '';
                }, 2000);
            }
        } catch (error) {
            console.error('💥 Error al grabar clip:', error);
            mostrarNotificacion(
                '🌐 Error de conexión: No se pudo comunicar con el servidor.\nVerifique su conexión a internet y que el servidor esté ejecutándose.', 
                'error'
            );
            
            // Efecto de error de conexión
            container.style.boxShadow = '0 32px 64px -12px rgba(239, 68, 68, 0.25)';
            setTimeout(() => {
                container.style.boxShadow = '';
            }, 2000);
        } finally {
            toggleButton(false);
        }
    });

    // Atajos de teclado
    document.addEventListener('keydown', (e) => {
        // Ctrl/Cmd + Enter para enviar
        if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
            form.dispatchEvent(new Event('submit'));
        }
        
        // Escape para limpiar notificación
        if (e.key === 'Escape' && notificacion.style.display === 'block') {
            notificacion.style.display = 'none';
        }
    });

    // Efecto de hover mejorado para el contenedor
    container.addEventListener('mouseenter', () => {
        if (!container.classList.contains('loading')) {
            container.style.transform = 'translateY(-8px) scale(1.02)';
        }
    });

    container.addEventListener('mouseleave', () => {
        if (!container.classList.contains('loading')) {
            container.style.transform = 'translateY(0) scale(1)';
        }
    });

    // Prevenir envío múltiple
    let isSubmitting = false;
    form.addEventListener('submit', (e) => {
        if (isSubmitting) {
            e.preventDefault();
            return;
        }
        isSubmitting = true;
        setTimeout(() => {
            isSubmitting = false;
        }, 1000);
    });

    console.log('🚀 Atlantic Video Recorder inicializado correctamente');
}); 
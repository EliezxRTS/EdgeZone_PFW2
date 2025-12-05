// EVENTOS DE TECLADO: Contador de caracteres para todos los inputs de texto y textarea
document.addEventListener('DOMContentLoaded', () => {
    // Mapeamos los inputs con sus longitudes según la base de datos
    const maxLengths = {
        'nombre': 100,
        'coleccion': 100,
        'nombre_juego': 100,
        'nombre_partida': 100,
        'resultado': 50,
        'imagen_url': 255,
        'descripcion': 1000
    };

    document.querySelectorAll('input[type="text"], textarea').forEach(input => {
        const name = input.getAttribute('name');
        const maxLength = maxLengths[name] || 100; // valor por defecto
        input.setAttribute('maxlength', maxLength);

        // crear wrapper
        const wrapper = document.createElement('div');
        wrapper.classList.add('input-counter-wrapper');
        input.parentNode.insertBefore(wrapper, input);
        wrapper.appendChild(input);

        // crear contador
        const counter = document.createElement('span');
        counter.classList.add('input-counter');
        wrapper.appendChild(counter);

        // función de actualización
        const updateCounter = () => {
            counter.textContent = maxLength - input.value.length;
        };

        input.addEventListener('input', updateCounter);
        updateCounter();
    });

    // EVENTOS DE ANIMACIÓN
    // Animación en filas de tabla de recientes (home)
    document.querySelectorAll('#list-partidas-content .tab-pane').forEach(tab => {
        tab.addEventListener('mouseenter', () => {
            tab.classList.add('animate__animated', 'animate__pulse');
        });
        tab.addEventListener('animationend', () => {
            tab.classList.remove('animate__animated', 'animate__pulse');
        });
    });

    // Animación en carrusel (home)
    const carouselEl = document.getElementById('miniaturasCarousel');
    if (carouselEl) {
        carouselEl.addEventListener('slid.bs.carousel', () => {
            const activeImg = carouselEl.querySelector('.carousel-item.active img');
            activeImg.classList.add('animate-highlight');
            activeImg.addEventListener('animationend', () => {
                activeImg.classList.remove('animate-highlight');
            }, { once: true });
        });
    }

    // ---------------------------------------
    // DRAG & DROP REAL PARA GALERÍA
    // ---------------------------------------
    const dropzone = document.getElementById('dropzone');
    const cards = document.querySelectorAll('.miniboxStandard');

    if (dropzone && cards.length > 0) {
        // Permitir que el dropzone reciba elementos
        dropzone.addEventListener('dragover', e => {
            e.preventDefault();
            dropzone.classList.add('dropzone-hover');
        });

        dropzone.addEventListener('dragleave', () => {
            dropzone.classList.remove('dropzone-hover');
        });

        dropzone.addEventListener('drop', e => {
            e.preventDefault();
            dropzone.classList.remove('dropzone-hover');

            const cardId = e.dataTransfer.getData('card-id');
            const originalCard = document.querySelector(`.miniboxStandard[data-id="${cardId}"]`);

            if (!originalCard) return;

            // Animación inicial de entrada
            dropzone.classList.add('dropzone-received');

            // Clon ampliado
            const clone = originalCard.cloneNode(true);
            clone.classList.add('card-expanded');

            // Limpiar el dropzone y colocar la tarjeta ampliada
            dropzone.innerHTML = "";
            dropzone.appendChild(clone);

            // al terminar animación, quitar clase glow
            setTimeout(() => {
                dropzone.classList.remove('dropzone-received');
            }, 800);
        });

        // Hacer tarjetas draggable
        cards.forEach(card => {
            card.setAttribute('draggable', true);

            // Requerimos un ID para identificar cada tarjeta
            if (!card.dataset.id) {
                console.warn("Card sin data-id detectada. Agrega data-id='{{id}}' en la vista.");
            }

            card.addEventListener('dragstart', e => {
                e.dataTransfer.setData('card-id', card.dataset.id);
                e.dataTransfer.effectAllowed = "move";
            });
        });

        console.log("Drag & drop cargado en galería.");
    }
});

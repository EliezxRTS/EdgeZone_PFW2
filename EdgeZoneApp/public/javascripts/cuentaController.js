import { apiRequest } from './api.js';

export class CuentaController {

    constructor(view) {
        this.view = view;
        this.originalData = {};
        this.modal = null;
        this.pendingData = {};
    }

    async init() {
        await this.cargarDatosUsuario();

        this.modal = new bootstrap.Modal(
            document.getElementById("modalConfirmarActualizacion")
        );

        this.view.setEventHandlers({
            onSave: (datosForm) => this.preConfirm(datosForm)
        });
    }

    async cargarDatosUsuario() {
        try {
            const data = await apiRequest('/usuario/info', 'GET');

            this.originalData = {
                username: data.username,
                email: data.email
            };

            this.view.render(this.originalData);

        } catch (err) {
            console.error("Error cargando datos usuario:", err);
        }
    }

    preConfirm(datosForm) {
        this.pendingData = datosForm;
        this.modal.show();
    }

    async confirmarActualizacion() {

        const cambios = {};

        for (const campo in this.pendingData) {
            const nuevo = this.pendingData[campo];
            const viejo = this.originalData[campo];

            if (nuevo && nuevo !== viejo) {
                cambios[campo] = nuevo;
            }
        }

        if (Object.keys(cambios).length === 0) {
            this.view.showMessage("No hay cambios para actualizar.");
            return;
        }

        try {
            const resultado = await apiRequest('/usuario/actualizar', 'POST', cambios);

            if (resultado.success) {
                Object.assign(this.originalData, cambios);
                this.view.showMessage("Datos actualizados correctamente.");
            } else {
                this.view.showMessage("No se pudo actualizar.");
            }

        } catch (err) {
            console.error("Error actualizando usuario:", err);
            this.view.showMessage("Ocurrió un error.");
        }
    }
}

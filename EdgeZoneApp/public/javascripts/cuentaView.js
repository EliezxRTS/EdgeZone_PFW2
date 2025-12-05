export class CuentaView {

    constructor() {
        this.form = document.getElementById("form-cuenta");
        this.btnGuardar = document.getElementById("btn-guardar");
        this.btnConfirmar = document.getElementById("btn-confirmar-actualizacion");
    }

    render(data) {
        this.form.username.value = data.username;
        this.form.email.value = data.email;
    }

    setEventHandlers({ onSave }) {

        this.btnGuardar.addEventListener("click", () => {
            const datosForm = {
                username: this.form.username.value.trim(),
                email: this.form.email.value.trim(),
                password: this.form.password.value.trim()
            };

            onSave(datosForm);
        });

        this.btnConfirmar.addEventListener("click", () => {
            window.cuentaController.confirmarActualizacion();
        });
    }

    showMessage(msg) {
        alert(msg);
    }
}

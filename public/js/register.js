function register() {
    let name = document.getElementById('name').value;
    let email = document.getElementById('email').value;
    let password = document.getElementById('password').value;
    let password_rep = document.getElementById('repeat-password').value;

    if (password !== password_rep) {
        alert('Les contrassenyes no coincideixen.');
    }

    console.log(name);
    console.log(email);
    console.log(password);
    console.log(password_rep);
}
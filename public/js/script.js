const email = document.querySelector('#email');
const username = document.querySelector('#username');
const signUpSubmit = document.querySelector('#signUpSubmit');
const password = document.querySelector('#password');
const confirmPassword = document.querySelector('#confirmPassword');

if (typeof (signUpSubmit) != 'undefined' && signUpSubmit != null) {
    signUpSubmit.addEventListener('click', (e) => {
        if (username.value === "") {
            e.preventDefault();
            window.alert('Form Requires Username');
        }
        if (password.value != confirmPassword.value) {
            e.preventDefault();
            window.alert('Passwords do not match');
        }
    });
}

const messageContainer = document.querySelector('.messageContainer');
const queryString = window.location.search;

if (queryString == '?incorrectLogin') {
    messageContainer.innerHTML = `<div class="card-panel red">Incorrect Log In Details</div>`;
}



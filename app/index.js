class SlackAutoInvite {
  constructor(container) {
    this.container = container;
  }

  init() {
    this.container.innerHTML = `
      <form id="autoinvite-form" action="soon" method="POST">
        <input type="email" name="email" placeholder="Email" />
        <button style="display:none;">Submit</button>
      </form>
    `;
    this.input = this.container.querySelector('input');
    this.container
      .querySelector('form')
      .addEventListener('submit', this.handleSubmit.bind(this));
  }

  handleSubmit(e) {
    e.preventDefault();

    this.showMessage({message: 'loading...'});
    fetch('https://google.com', {
      body: JSON.stringify({ email: this.input.value }),
      credentials: 'same-origin',
      method: 'POST',
    })
      .then(this.showMessage.bind(this))
      .catch(this.showError.bind(this));
  }

  showMessage({ message }) {
    this.container.innerHTML = `<span>${message}</span>`;
    this.container.querySelector('span')
      .addEventListener('click', this.init.bind(this));
  }

  showError({ error } = {}) {
    this.container.innerHTML = `
        <span style="color: #ff3b2f">
            ${error || 'Something went wrong!'}
        </span>
    `;
    this.container.querySelector('span')
      .addEventListener('click', this.init.bind(this));
  }
}

const initForm = (e) => {
  const formContainer = document.createElement('div');
  formContainer.classList = 'form-container';
  e.target.parentNode.replaceChild(formContainer, e.target);
  new SlackAutoInvite(formContainer).init();
};

document.getElementById('get-slack-invite').addEventListener('click', initForm);

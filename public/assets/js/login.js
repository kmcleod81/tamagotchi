function validateInputs(obj) {
  const inputs = Object.entries(obj).filter(([key, val]) => val.length === 0);

  if (inputs.length > 0) {
    const required = inputs.map(([key, val]) => `${key}: is required.`);
    return required;
  }

  return true;
}

function getClientCreds() {
  const obj = {
    token: JSON.parse(localStorage.getItem('accessToken')),
    uuid: JSON.parse(localStorage.getItem('uuid')),
    username: JSON.parse(localStorage.getItem('username')),
  };

  return obj;
}

$('#login').on('click', () => {
  const obj = {
    username: $('#username').val(),
    password: $('#passwordOne').val(),
  };
  const valid = validateInputs(obj);

  // todo create a toast or some on screen notification for the following console.logs

  if (Array.isArray(valid)) {
    valid.map((item) => console.log(item));
  } else {
    $.post('/api/users/login', obj, (result) => {
      if (result.status === 200) {
        // todo might need to check that if token already exists to update it
        localStorage.setItem('username', JSON.stringify(result.username));
        localStorage.setItem('accessToken', JSON.stringify(result.accessToken));
        localStorage.setItem('uuid', JSON.stringify(result.uuid));
        window.location.assign('/list'); // navigate to the login screen
      } else if (result.status === 404) {
        // todo toast explaining what went wrong
        console.log('User does not exist!');
      } else {
        // todo toast explaining what went wrong
        console.log(result);
      }
    });
  }
});

$('#logout').click(() => {
  const { username } = getClientCreds();
  localStorage.setItem('accessToken', JSON.stringify('null')); // to call it elsewhere

  $.ajax({
    url: '/api/users/logout',
    type: 'post',
    data: { username },
    dataType: 'json',
  })
    .then(async (result) => {
      // todo add logout successufl toast
      console.log(result);
    })
    .then(() => {
      window.location.assign('/');
    })
    .fail((result) => {
      // todo add a toast here
      console.log(result);
    });
});

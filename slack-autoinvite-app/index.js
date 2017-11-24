require('dotenv').config();

const { SLACK_URL, SLACK_TOKEN, MAIL_CHECKER_API_KEY } = process.env;
const PORT = process.env.PORT || 5000;

const request = require('request-promise');
const Koa = require('koa');
const koaBody = require('koa-body');
const app = new Koa();


app.use(koaBody());

const matchRequest = ({ method, path }) => {
  return /^\/slack-invite\/?$/.test(path) && method === 'POST';
};

const checkEmail = async (email) => {
  try {
    const requestUrl = 'http://apilayer.net/api/check?' +
      'access_key=' + MAIL_CHECKER_API_KEY +
      '&email=' + email;

    const emailCheckerResponse = JSON.parse(await request(requestUrl));
    const { format_valid, mx_found, smtp_check } = emailCheckerResponse;

    return format_valid && smtp_check && mx_found;
  } catch (err) {
    // Looks like mail checker service failed.
    // Go rely on Slack's email check.

    return 1;
  }
};

app.use(async (ctx) => {
  if (!matchRequest(ctx)) {
    return;
  }

  const emailToInvite = ctx.request.body.email;

  if (!emailToInvite) {
    ctx.status = 400;
    ctx.body = { message: 'Please provide an email!' };

    return;
  }

  const isEmailValid = await checkEmail(emailToInvite);

  if (!isEmailValid) {
    ctx.status = 400;
    ctx.body = { message: 'Invalid email!' };

    return;
  }

  const slackResponse = JSON.parse(
    await request.post({
      url: 'https://' + SLACK_URL + '/api/users.admin.invite',
      form: {
        email: emailToInvite,
        token: SLACK_TOKEN,
        set_active: true,
      },
    }),
  );

  if (slackResponse.ok) {
    ctx.status = 202;
    ctx.body = { message: 'Invite has been sent!' };

    return;
  }

  if (slackResponse.error === 'already_invited') {
    ctx.status = 201;
    ctx.body = { message: 'You have been invited already!' };
  } else if (slackResponse.error === 'already_in_team') {
    ctx.status = 201;
    ctx.body = { message: 'You are in team already!' };
  } else {
    ctx.status = 400;
    ctx.body = { message: 'Error!' };
  }
});


console.log('Listening on port: ' + PORT);

app.listen(PORT);

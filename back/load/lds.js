
import superagent from 'superagent';
import repl from 'repl';

export default function ldsLogin(username, password, done) {
  var agent = superagent.agent();

  var params = {
      'IDToken1': username,
      'IDToken2': password,
      'IDButton': 'Log In',
      'goto':'',
      'gotoOnFail':'',
      'SunQueryParamsString':'',
      'encoded':'false',
      'gx_charset':'UTF-8',
  }

  agent.get('https://www.lds.org').end((err, res) => {
    console.log('one');
    agent.get('https://www.lds.org/study-tools/folders?lang=eng').end((err, res) => {
      console.log('two');
      agent.get('https://ident.lds.org/sso/UI/Login').end((err, res) => {
        console.log('THREE');
        setTimeout(() => {
          agent.post('https://ident.lds.org/sso/UI/Login')
            .type('form')
            .send(params)
            .set('referer', 'https://ident.lds.org/sso/UI/Login')
            .end((err, res) => {
              var auth = agent.jar.getCookie('ObSSOCookie', {domain: 'lds.org', secure: true, path: '/'});
              if (!auth) return done(new Error('Unable to log in'));
              done(null, auth.value);
            });
        }, 20 * 1000);
      });
    })
  });
}


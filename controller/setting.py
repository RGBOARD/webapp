import json

import flask

from google_auth_oauthlib.flow import Flow


CLIENT_SECRETS_FILE = 'client_secret.json'
CREDENTIALS_JSON_FILE = "stored_credentials.json"
SCOPES = ["https://www.googleapis.com/auth/gmail.send"]

def authorize_mail():
    """
    Initiates OAuth 2.0 authorization flow.
    """
    flow = Flow.from_client_secrets_file(
        client_secrets_file=CLIENT_SECRETS_FILE,
        scopes=SCOPES)

    # TODO: Use localhost for this if testing. Use a domain for production
    flow.redirect_uri = "https://bears-abc-ladies-reality.trycloudflare.com/settings/mail/oauth2callback"

    authorization_url, state = flow.authorization_url(
        access_type='offline',
        include_granted_scopes='true')

    flask.session['state'] = state

    return flask.redirect(authorization_url)

def authorize_callback():
    """
    OAuth 2.0 callback that exchanges the authorization code for tokens.
    """
    state = flask.session['state']

    flow = Flow.from_client_secrets_file(
        client_secrets_file=CLIENT_SECRETS_FILE,
        scopes=SCOPES,
        state=state)

    #TODO: Use localhost for this if testing. Use a domain for production
    flow.redirect_uri = "https://bears-abc-ladies-reality.trycloudflare.com/settings/mail/oauth2callback"

    authorization_response = flask.request.url

    flow.fetch_token(authorization_response=authorization_response)

    credentials = flow.credentials

    credentials_dict = credentials_to_dict(credentials)

    with open(CREDENTIALS_JSON_FILE, 'w') as f:
        json.dump(credentials_dict, f, indent=2)

    return flask.redirect('/')

def credentials_to_dict(credentials):
    """
    Converts Credentials object into a JSON-serializable dictionary.
    """
    return {
        'token': credentials.token,
        'refresh_token': credentials.refresh_token,
        'token_uri': credentials.token_uri,
        'client_id': credentials.client_id,
        'client_secret': credentials.client_secret,
        'scopes': credentials.scopes
    }

# Security

## Report a problem

Send an email to the support address on [instaticker.com](https://www.instaticker.com/). Do not open a
public issue for a security problem. Tell us what you found and how to reproduce it. Do not include an
account key.

## A leaked account key

1. Open the API Keys page of the Instaticker dashboard.
2. Click **Revoke** on the key. Agents that use it stop working at once.
3. Create a new key, and put it in `INSTATICKER_API_KEY` of your MCP client.

The server keeps the key in memory only. It sends the key only in the `Authorization` header to the
Instaticker API, and it writes the key to no log and no error message.

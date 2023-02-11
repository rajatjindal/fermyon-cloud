# GitHub Action: fermyon-preview-deploy

Disclaimer: This is a poc only and not an official Fermyon project.

The `rajatjindal/fermyon-preview-deploy` is a poc to demonstrate preview deployment of your `spin` apps to [Fermyon cloud](https://fermyon.com/cloud). 

## Usage

:warning: Please remember to cleanup the token artifact at the end to prevent exposing it if your repo is public.

```yml
name: Build
on:
  pull_request:
    branches: [main]

jobs:
  cloud-login:
    uses: "rajatjindal/actions/.github/workflows/auth.yml@fix-auth2"
    secrets:
      gh_username: ${{ secrets.DEV_DOCS_PREVIEW_GH_USERNAME }}
      gh_password: ${{ secrets.DEV_DOCS_PREVIEW_GH_PASSWORD }}
      gh_totp_secret: ${{ secrets.DEV_DOCS_PREVIEW_GH_TOTP_SECRET }}
    with:
      fermyon_deployment_env: developer-docs-preview

  preview:
    runs-on: "ubuntu-latest"
    needs: [cloud-login]
    steps:
      - uses: actions/checkout@v3

      - name: Retrieve saved cloud token
        uses: actions/download-artifact@v3
        with:
          name: developer-docs-preview.json
          path: ${{ env.GITHUB_WORKSPACE }}

      - name: Deploy preview on cloud
        uses: rajatjindal/fermyon-preview-deploy@main
        with:
          github_token: ${{ secrets.GITHUB_TOKEN }}
          fermyon_token_file_name: "developer-docs-preview.json"

  cleanup: 
    runs-on: ubuntu-latest
    needs: [preview]
    if: always()
    steps:
    - uses: geekyeggo/delete-artifact@v2
      if: always()
      with:
        name: developer-docs-preview.json

```

## what it do today

- Only works for PR's right now
- It deploys preview of your app to Fermyon cloud. 
- Name of app is derived from your app_name and PR number
- If preview of PR already exists, it updates the same preview deployment
- If the limit of number of apps is reached, you can chose to overwrite the PR least recently updated (disabled by default)
- After preview deployment is finished, it adds the comment to the PR with link to preview

## TODO

- Undeploy preview when PR is closed (merged or otherwise)
- Restrict the permissions of GITHUB_TOKEN

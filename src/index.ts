import * as core from '@actions/core'
import * as fermyon from './fermyon'
import * as github from '@actions/github';
import * as io from '@actions/io'
import { GithubClient } from './github'

async function run(): Promise<void> {
  try {
    if (!github.context.payload.pull_request) {
      throw `this action currently support deploying apps on PR only`
    }

    core.info(":eyes: reading spin.toml")
    const spinConfig = fermyon.getSpinConfig()
    const realAppName = spinConfig.name

    const currentPRNumber = github.context.payload.pull_request?.number
    const previewAppName = `${spinConfig.name}-pr-${currentPRNumber}`

    core.info(":octocat: creating Github client")
    const ghclient = new GithubClient(github.context.repo.owner, github.context.repo.repo, core.getInput("github_token"))

    core.info(":anchor: setting up spin")
    await fermyon.setupSpin()

    core.info(":ticket: configuring token for spin auth")
    if (core.getInput('fermyon_token') !== '') {
      await fermyon.createTokenFile(core.getInput('fermyon_token'))
    } else if (core.getInput('fermyon_token_file_name') !== '') {
      //we can remove this later
      const inputTokenFile = `${process.env.GITHUB_WORKSPACE}/${core.getInput('fermyon_token_file_name')}`
      const defaultInputTokenFile = `${process.env.GITHUB_WORKSPACE}/config.json`
      const tokenFile = inputTokenFile && inputTokenFile !== '' ? inputTokenFile : defaultInputTokenFile
      await fermyon.configureTokenFile(tokenFile)
    } else {
      throw `atleast one of 'fermyon_token_file_name' or 'fermyon_token' should be provided`
    }

    core.info(":cloud: creating Fermyon client")
    const fermyonClient = fermyon.initClient()

    core.info("checking if have room to deploy this preview")
    const apps = await fermyonClient.getAllApps()
    const thisPreviewExists = apps.find(item => item.name === previewAppName)

    // for when PR is closed
    if (github.context.payload.action === 'closed') {
      if (!thisPreviewExists) {
        core.info(`no preview found for pr ${currentPRNumber}`)
        return
      }

      core.info(`cleaning up preview for pr ${currentPRNumber}`)
      await fermyonClient.deleteAppByName(previewAppName)
      return
    }

    if (!thisPreviewExists && apps.length >= 5) {
      if (core.getInput("overwrite_old_previews") !== 'true') {
        throw `max apps allowed limit exceeded. max_allowed: 5, current_apps_count: ${apps.length}. Use option 'overwrite_old_previews=true' to overwrite old previews`
      }

      core.info(":closed_lock_with_key: apps limit reached. finding oldest pr to overwrite")
      const oldestDeployedPRNumber = await ghclient.findOldestPRNumber()
      const oldestDeployedPRPreviewName = `${spinConfig.name}-pr-${oldestDeployedPRNumber}`

      core.info(`:scissors: deleting app by name ${oldestDeployedPRPreviewName}`)
      await fermyonClient.deleteAppByName(oldestDeployedPRPreviewName)
    }

    core.info(`:name_badge: deploying preview as ${previewAppName}`)
    const metadata = await fermyonClient.deployAs(realAppName, previewAppName)

    const comment = `Your preview is available at ${metadata.base}`
    await ghclient.updateComment(currentPRNumber, comment)

    core.info(`:zap: preview deployment successful and available at ${metadata.base}`)
  } catch (error) {
    if (error instanceof Error) core.setFailed(error.message)
  }
}

run()

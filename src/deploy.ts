import * as core from '@actions/core'
import * as fermyon from './fermyon'

async function run(): Promise<void> {
  try {
    core.info(":eyes: reading spin.toml")
    const spinConfig = fermyon.getSpinConfig()
    const appName = spinConfig.name

    core.info(":ticket: configuring token for spin auth")
    const fermyonToken = core.getInput('fermyon_token')
    if (!fermyonToken || fermyonToken === '') {
      throw "fermyon_token is required for this action"
    }
    await fermyon.createTokenFile(core.getInput('fermyon_token'))

    core.info(":anchor: setting up spin")
    await fermyon.setupSpin()

    core.info(":cloud: creating Fermyon client")
    const fermyonClient = fermyon.initClient()

    const spinTomlFile = core.getInput('spin_toml_file') || 'spin.toml'
    core.info(`:name_badge: deploying app ${appName} using ${spinTomlFile}`)
    const metadata = await fermyonClient.deploy(appName, spinTomlFile)

    core.info(`:zap: deployment successful and available at ${metadata.base}`)
  } catch (error) {
    if (error instanceof Error) core.setFailed(error.message)
  }
}

run()


import * as core from '@actions/core'
import * as fermyon from './fermyon'

async function run(): Promise<void> {
    try {
        const fermyonToken = core.getInput('fermyon_token')
        if (!fermyonToken || fermyonToken === '') {
            throw "fermyon_token is required for this action"
        }
        await fermyon.createTokenFile(core.getInput('fermyon_token'))
    } catch (error) {
        if (error instanceof Error) core.setFailed(error.message)
    }
}

run()
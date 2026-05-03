import 'dotenv/config'
import { execSync } from 'node:child_process'
import { existsSync, readFileSync, writeFileSync } from 'node:fs'
import { resolve } from 'node:path'

const PROJECT_NAME = process.env.PROJECT_NAME || 'next-template'

/**
 * Run database migrations
 */
const migrateDatabase = () => {
  console.log('📝 Migrating remote database...')
  try {
    execSync('pnpm run db:migrate-remote', { stdio: 'inherit' })
    console.log('✅ Database migration completed successfully')
  } catch (error) {
    console.error('❌ Database migration failed:', error)
    throw error
  }
}

const pushWorkerSecret = () => {
  console.log('🔐 Pushing environment secrets to Pages...')

  try {
    // Ensure .env file exists
    if (!existsSync(resolve('.env'))) {
      setupEnvFile()
    }

    // Push all variables from the local .env file.
    execSync(`pnpm dlx wrangler secret bulk ${resolve('.env')} --name ${PROJECT_NAME}`, { stdio: 'inherit' })

    console.log('✅ Secrets pushed successfully')
  } catch (error) {
    console.error('❌ Failed to push secrets:', error)
    throw error
  }
}

/**
 * Deploy the Pages app
 */
const deployWorkers = () => {
  console.log('🚧 Deploying to Cloudflare Pages...')
  try {
    execSync('pnpm run deploy', { stdio: 'inherit' })
    console.log('✅ Pages deployment completed successfully')
  } catch (error) {
    console.error('❌ Pages deployment failed:', error)
    throw error
  }
}

/**
 * Create or update the environment file
 */
const setupEnvFile = () => {
  console.log('📄 Setting up environment file...')
  const envFilePath = resolve('.env')
  const envExamplePath = resolve('.env.example')

  // If .env is missing, create it from .env.example
  if (!existsSync(envFilePath) && existsSync(envExamplePath)) {
    console.log('⚠️ .env file does not exist, creating from example...')

    // Copy the example file
    let envContent = readFileSync(envExamplePath, 'utf-8')

    // Fill in currently set environment variables
    const envVarMatches = envContent.match(/^([A-Z_]+)\s*=\s*".*?"/gm)
    if (envVarMatches) {
      for (const match of envVarMatches) {
        const varName = match.split('=')[0].trim()
        if (process.env[varName]) {
          const regex = new RegExp(`${varName}\\s*=\\s*".*?"`, 'g')
          envContent = envContent.replace(regex, `${varName} = "${process.env[varName]}"`)
        }
      }
    }

    writeFileSync(envFilePath, envContent)
    console.log('✅ .env file created from example')
  } else if (existsSync(envFilePath)) {
    console.log('✨ .env file already exists')
  } else {
    console.error('❌ .env.example file not found!')
    throw new Error('.env.example file not found')
  }
}

/**
 * Entrypoint
 */
const main = async () => {
  try {
    console.log('🚀 Starting deployment process...')

    setupEnvFile()
    migrateDatabase()
    await pushWorkerSecret()
    deployWorkers()

    console.log('🎉 Deployment completed successfully')
  } catch (error) {
    console.error('❌ Deployment failed:', error)
    process.exit(1)
  }
}

main()

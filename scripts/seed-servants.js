const { createClient } = require('@supabase/supabase-js')
const fs = require('fs')
const path = require('path')

// Load environment variables from .env.local
const envPath = path.resolve(__dirname, '../.env.local')
if (fs.existsSync(envPath)) {
  const envConfig = fs.readFileSync(envPath, 'utf8')
  for (const line of envConfig.split('\n')) {
    const trimmed = line.trim()
    if (!trimmed || trimmed.startsWith('#')) continue
    const [key, ...vals] = trimmed.split('=')
    if (key && vals.length) {
      process.env[key.trim()] = vals.join('=').trim()
    }
  }
}

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || ''

const supabase = createClient(supabaseUrl, serviceKey, {
  auth: { autoRefreshToken: false, persistSession: false },
})

const servants = [
  { name: 'Marina', email: 'marina@app.com' },
  { name: 'Madona', email: 'madona@app.com' },
  { name: 'Youstina', email: 'youstina@app.com' },
  { name: 'Ramy', email: 'ramy@app.com' },
  { name: 'Fady', email: 'fady@app.com' },
  { name: 'Beshoy', email: 'beshoy@app.com' },
  { name: 'Pavly', email: 'pavly@app.com' },
  { name: 'Abanoub', email: 'abanoub@app.com' },
]

const PASSWORD = 'Admin123'

async function seed() {
  console.log('--- Provisioning Servant Accounts ---')
  console.log(`Target: ${servants.length} accounts with password "${PASSWORD}"\n`)

  for (const s of servants) {
    try {
      // 1. Check if user already exists
      const { data: usersData, error: listError } = await supabase.auth.admin.listUsers()
      if (listError) throw listError

      const existingUser = usersData.users.find(
        (u) => u.email?.toLowerCase() === s.email.toLowerCase()
      )

      let userId = existingUser?.id

      if (existingUser) {
        console.log(`[EXISTS] User ${s.email} found. Updating password...`)
        const { error: updateError } = await supabase.auth.admin.updateUserById(userId, {
          password: PASSWORD,
          email_confirm: true,
          user_metadata: { full_name: s.name, role: 'user' },
        })
        if (updateError) {
          console.error(`  Error updating password for ${s.email}:`, updateError.message)
        } else {
          console.log(`  Password updated successfully for ${s.email}`)
        }
      } else {
        console.log(`[CREATE] Creating user ${s.email} (${s.name})...`)
        const { data: createData, error: createError } = await supabase.auth.admin.createUser({
          email: s.email,
          password: PASSWORD,
          email_confirm: true,
          user_metadata: { full_name: s.name, role: 'user' },
        })

        if (createError) {
          console.error(`  Error creating ${s.email}:`, createError.message)
          continue
        }

        userId = createData.user.id
        console.log(`  Created successfully with ID: ${userId}`)
      }

      // 2. Upsert profile in public.profiles
      const { error: profileError } = await supabase.from('profiles').upsert({
        id: userId,
        full_name: s.name,
        email: s.email,
        role: 'user',
        is_active: true,
      })

      if (profileError) {
        console.error(`  Error upserting profile for ${s.name}:`, profileError.message)
      } else {
        console.log(`  Profile upserted for ${s.name} (role: user, is_active: true)`)
      }
    } catch (err) {
      console.error(`Unexpected error for ${s.email}:`, err.message)
    }
  }

  console.log('\n--- All Servant Accounts Processed Successfully! ---')
}

seed().catch(console.error)

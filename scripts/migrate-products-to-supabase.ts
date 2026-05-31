import { createClient } from '@supabase/supabase-js'
import { products } from '../src/data/catalog'
import dotenv from 'dotenv'
import { resolve } from 'path'

// Load environment variables from .env.local
dotenv.config({ path: resolve(process.cwd(), '.env.local') })

const supabaseUrl = process.env.VITE_SUPABASE_URL
const supabaseServiceKey = process.env.VITE_SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('VITE_SUPABASE_URL and VITE_SUPABASE_SERVICE_ROLE_KEY must be set in .env.local')
  console.error('Get SERVICE_ROLE_KEY from Supabase Dashboard → Project Settings → API')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
})

async function migrateProducts() {
  console.log('Starting migration of products to Supabase...')
  console.log('Using service role key to bypass RLS policies...')

  for (const product of products) {
    try {
      const { error } = await supabase
        .from('products')
        .upsert({
          id: product.id,
          title: product.title,
          category: product.category,
          collection: product.collection,
          price: product.price,
          image: product.image,
          specs: product.specs,
          summary: product.summary,
          source_url: product.sourceUrl,
          available: true
        }, {
          onConflict: 'id'
        })

      if (error) {
        console.error(`Error inserting product ${product.id}:`, error)
      } else {
        console.log(`✓ Migrated: ${product.title}`)
      }
    } catch (error) {
      console.error(`Error processing product ${product.id}:`, error)
    }
  }

  console.log('Migration complete!')
}

migrateProducts()
